"use client";

import { useCallback, useEffect, useState } from "react";
import { bff } from "@/lib/api";
import type { Envelope, Group, Me, Page, User } from "@/lib/types";
import { useI18n } from "@/i18n/provider";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dialog } from "./Dialog";
import { GroupDialog } from "./GroupDialog";
import { PermissionsDialog } from "./PermissionsDialog";

// A tenant has few groups, so one page of 100 is enough here. (The API pages at most 100 per request.)
const PER_PAGE = 100;

export function GroupsView() {
  const { t, errorText } = useI18n();
  const [data, setData] = useState<Page<Group> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formFor, setFormFor] = useState<Group | "new" | null>(null);
  const [permsFor, setPermsFor] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);
  const [blocked, setBlocked] = useState<{ group: Group; users: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [myGroupId, setMyGroupId] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    bff<Envelope<Page<Group>>>(`groups?per_page=${PER_PAGE}&sort=name`, { signal: ctl.signal })
      .then((r) => {
        setData(r.data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!ctl.signal.aborted) setError(errorText(err));
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });
    return () => ctl.abort();
    // errorText changes with the language; a language switch must not refetch the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // The group of the signed-in user, so the permissions dialog can refuse changes that would lock them out.
  // If the lookup fails (no permission to read users) the guard stays off; the API still decides what is allowed.
  useEffect(() => {
    const ctl = new AbortController();
    bff<Me>("auth/me", { signal: ctl.signal })
      .then((me) => bff<Envelope<User>>(`users/${me.user_id}`, { signal: ctl.signal }))
      .then((r) => setMyGroupId(r.data.group_id))
      .catch(() => undefined);
    return () => ctl.abort();
  }, []);

  // A group with users cannot be deleted from here: the API does not check, and its users would lose their access.
  async function startDelete(g: Group) {
    setChecking(true);
    setError(null);
    try {
      const r = await bff<Envelope<Page<User>>>(`users?group_id=${encodeURIComponent(g.group_id)}&per_page=1`);
      if (r.data.total_data > 0) setBlocked({ group: g, users: r.data.total_data });
      else setDeleting(g);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setChecking(false);
    }
  }

  async function remove(g: Group) {
    await bff(`groups/${g.group_id}`, { method: "DELETE" });
    reload();
  }

  const rows = data?.data ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t("groups.title")}</h1>
          <p className="muted">{t("groups.count", { n: data?.total_data ?? 0 })}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormFor("new")}>
          {t("groups.add")}
        </button>
      </div>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <div className="table-wrap" aria-busy={loading}>
        <table className="users-table">
          <thead>
            <tr>
              <th>{t("groups.name")}</th>
              <th>{t("groups.description")}</th>
              <th className="num">{t("groups.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.group_id}>
                <td className="cell-name">
                  <strong>{g.name}</strong>
                </td>
                <td className={g.description ? undefined : "muted"} data-label={t("groups.description")}>
                  {g.description || "—"}
                </td>
                <td className="num">
                  <div className="actions">
                    <button type="button" className="btn btn-sm" onClick={() => setPermsFor(g)}>
                      {t("groups.permissions")}
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => setFormFor(g)}>
                      {t("groups.edit")}
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => startDelete(g)} disabled={checking}>
                      {t("groups.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !error && <p className="empty">{t("groups.empty")}</p>}
        {loading && rows.length === 0 && <p className="empty">{t("groups.loading")}</p>}
      </div>

      {formFor && (
        <GroupDialog open group={formFor === "new" ? null : formFor} onClose={() => setFormFor(null)} onSaved={reload} />
      )}
      {permsFor && (
        <PermissionsDialog open group={permsFor} ownGroup={permsFor.group_id === myGroupId} onClose={() => setPermsFor(null)} />
      )}
      {blocked && (
        <Dialog open onClose={() => setBlocked(null)} title={t("groups.deleteBlockedTitle")}>
          <p>{t("groups.deleteBlockedBody", { n: blocked.users, name: blocked.group.name })}</p>
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={() => setBlocked(null)}>
              {t("form.close")}
            </button>
          </div>
        </Dialog>
      )}
      {deleting && (
        <ConfirmDialog
          open
          danger
          title={t("groups.deleteTitle")}
          body={t("groups.deleteBody", { name: deleting.name })}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove(deleting)}
        />
      )}
    </>
  );
}
