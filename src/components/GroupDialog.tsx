"use client";

import { useState, type FormEvent } from "react";
import { ApiError, bff } from "@/lib/api";
import type { Group } from "@/lib/types";
import { ruleText, useI18n } from "@/i18n/provider";
import { Dialog } from "./Dialog";

// Creates a group, or edits one when `group` is given. A group has no permissions until you grant some.
export function GroupDialog({
  open,
  group,
  onClose,
  onSaved,
}: {
  open: boolean;
  group: Group | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      name: String(f.get("name") ?? "").trim(),
      description: String(f.get("description") ?? "").trim(),
    };

    setPending(true);
    setError(null);
    setFields({});
    try {
      if (group) await bff(`groups/${group.group_id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await bff("groups", { method: "POST", body: JSON.stringify(payload) });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorText(err));
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const d of err.details) next[d.field] = ruleText(t, d.rule);
        setFields(next);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={group ? t("groups.editTitle") : t("groups.addTitle")}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="group-name">{t("groups.name")}</label>
          <input
            id="group-name"
            name="name"
            className="input"
            defaultValue={group?.name ?? ""}
            maxLength={100}
            required
            autoComplete="off"
            aria-invalid={fields.name ? true : undefined}
            aria-describedby={fields.name ? "group-name-err" : undefined}
          />
          {fields.name && (
            <span id="group-name-err" className="field-error">
              {fields.name}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="group-description">{t("groups.description")}</label>
          <input
            id="group-description"
            name="description"
            className="input"
            defaultValue={group?.description ?? ""}
            maxLength={500}
            autoComplete="off"
          />
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t("form.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? t("form.saving") : t("form.save")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
