"use client";

import { useState, type FormEvent } from "react";
import { ApiError, bff } from "@/lib/api";
import type { Group, User } from "@/lib/types";
import { ruleText, useI18n } from "@/i18n/provider";
import { Dialog } from "./Dialog";

// Name, email and group. Username and password are not changed here: the username is the identity, and the
// password has its own endpoint (POST /users/:id/password).
export function EditUserDialog({
  open,
  user,
  groups,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: User;
  groups: Group[];
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
      email: String(f.get("email") ?? "").trim(),
      group_id: String(f.get("group_id") ?? ""), // "" removes the user from the group
    };

    setPending(true);
    setError(null);
    setFields({});
    try {
      await bff(`users/${user.user_id}`, { method: "PATCH", body: JSON.stringify(payload) });
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

  const field = (name: "name" | "email", label: string, type = "text", max = 100) => (
    <div className="field">
      <label htmlFor={`edit-${name}`}>{label}</label>
      <input
        id={`edit-${name}`}
        name={name}
        type={type}
        className="input"
        defaultValue={user[name]}
        maxLength={max}
        required
        autoComplete="off"
        aria-invalid={fields[name] ? true : undefined}
        aria-describedby={fields[name] ? `edit-${name}-err` : undefined}
      />
      {fields[name] && (
        <span id={`edit-${name}-err`} className="field-error">
          {fields[name]}
        </span>
      )}
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title={t("users.editTitle")}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <p className="muted">
          <span className="mono">{user.username}</span>
        </p>
        {field("name", t("users.name"))}
        {field("email", t("users.email"), "email", 254)}
        <div className="field">
          <label htmlFor="edit-group">{t("form.group")}</label>
          <select id="edit-group" name="group_id" className="select" defaultValue={user.group_id ?? ""}>
            <option value="">{t("users.noGroup")}</option>
            {groups.map((g) => (
              <option key={g.group_id} value={g.group_id}>
                {g.name}
              </option>
            ))}
          </select>
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
