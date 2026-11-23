"use client";

import { useEffect, useMemo, useState } from "react";
import { bff } from "@/lib/api";
import type { Endpoint, Envelope, Group, Permissions } from "@/lib/types";
import { useI18n } from "@/i18n/provider";
import { Dialog } from "./Dialog";

// "/api/v1/users/:id" belongs to the resource "users".
function resourceOf(path: string): string {
  const rest = path.replace(/^\/api\/v\d+\//, "");
  return rest.split("/")[0] || "/";
}

interface Section {
  resource: string;
  items: Endpoint[];
}

// Replaces the endpoints granted to a group (PUT /groups/:id/permissions). The set starts from what the group has
// now, including ids that are not in the grantable list, so saving never revokes something the admin cannot see.
export function PermissionsDialog({
  open,
  group,
  onClose,
}: {
  open: boolean;
  group: Group;
  onClose: () => void;
}) {
  const { t, errorText } = useI18n();
  const [endpoints, setEndpoints] = useState<Endpoint[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ctl = new AbortController();
    Promise.all([
      bff<Envelope<Endpoint[]>>("rbac/endpoints", { signal: ctl.signal }),
      bff<Envelope<Permissions>>(`groups/${group.group_id}/permissions`, { signal: ctl.signal }),
    ])
      .then(([eps, perms]) => {
        setEndpoints(eps.data);
        setSelected(new Set(perms.data.endpoint_ids));
      })
      .catch((err: unknown) => {
        if (!ctl.signal.aborted) setError(errorText(err));
      });
    return () => ctl.abort();
    // errorText changes with the language; a language switch must not reload the permissions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group.group_id]);

  const sections = useMemo<Section[]>(() => {
    const by = new Map<string, Endpoint[]>();
    for (const e of endpoints ?? []) {
      const r = resourceOf(e.path);
      by.set(r, [...(by.get(r) ?? []), e]);
    }
    return [...by.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([resource, items]) => ({
        resource,
        items: items.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)),
      }));
  }, [endpoints]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setMany(items: Endpoint[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const e of items) {
        if (on) next.add(e.endpoint_id);
        else next.delete(e.endpoint_id);
      }
      return next;
    });
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      await bff(`groups/${group.group_id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ endpoint_ids: [...selected] }),
      });
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  const total = endpoints?.length ?? 0;
  const count = endpoints ? endpoints.filter((e) => selected.has(e.endpoint_id)).length : 0;

  return (
    <Dialog open={open} onClose={onClose} title={t("groups.permTitle", { name: group.name })} wide>
      <p className="muted">{t("groups.permHelp")}</p>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {!endpoints && !error && <p className="empty">{t("groups.permLoading")}</p>}
      {endpoints && total === 0 && <p className="empty">{t("groups.permEmpty")}</p>}
      {endpoints && total > 0 && (
        <>
          <p className="muted" aria-live="polite">
            {t("groups.permSelected", { n: count, total })}
          </p>
          <div className="perm-list">
            {sections.map((s) => (
              <fieldset key={s.resource} className="perm-group">
                <legend>
                  <span className="mono">{s.resource}</span>
                </legend>
                <div className="perm-tools">
                  <button type="button" className="btn btn-sm" onClick={() => setMany(s.items, true)}>
                    {t("groups.permAll")}
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => setMany(s.items, false)}>
                    {t("groups.permNone")}
                  </button>
                </div>
                {s.items.map((e) => (
                  <label key={e.endpoint_id} className="check perm-row">
                    <input type="checkbox" checked={selected.has(e.endpoint_id)} onChange={() => toggle(e.endpoint_id)} />
                    <span className="mono">
                      <strong>{e.method}</strong> {e.path}
                    </span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        </>
      )}
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onClose}>
          {t("form.cancel")}
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={pending || !endpoints}>
          {pending ? t("form.saving") : t("form.save")}
        </button>
      </div>
    </Dialog>
  );
}
