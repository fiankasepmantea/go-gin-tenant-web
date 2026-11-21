"use client";

import { useState, type FormEvent } from "react";
import { ApiError, bff } from "@/lib/api";
import type { Group } from "@/lib/types";
import { ruleText, useI18n } from "@/i18n/provider";
import { Dialog } from "./Dialog";

export function AddUserDialog({
  open,
  groups,
  onClose,
  onCreated,
}: {
  open: boolean;
  groups: Group[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const groupId = String(f.get("group_id") ?? "");
    const payload: Record<string, unknown> = {
      username: String(f.get("username") ?? "").trim(),
      email: String(f.get("email") ?? "").trim(),
      name: String(f.get("name") ?? "").trim(),
      password: String(f.get("password") ?? ""),
      is_active: f.get("is_active") === "on",
    };
    if (groupId) payload.group_id = groupId;

    setPending(true);
    setError(null);
    setFields({});
    try {
      await bff("users", { method: "POST", body: JSON.stringify(payload) });
      onCreated();
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

  const text = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={`add-${name}`}>{label}</label>
      <input
        id={`add-${name}`}
        name={name}
        className="input"
        required
        aria-invalid={fields[name] ? true : undefined}
        aria-describedby={fields[name] ? `add-${name}-err` : undefined}
        {...props}
      />
      {fields[name] && (
        <span id={`add-${name}-err`} className="field-error">
          {fields[name]}
        </span>
      )}
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title={t("users.add")}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        {text("name", t("users.name"), { maxLength: 100, autoComplete: "off" })}
        {text("username", t("form.username"), { minLength: 3, maxLength: 64, autoCapitalize: "none", autoComplete: "off" })}
        {text("email", t("users.email"), { type: "email", maxLength: 254, autoComplete: "off" })}
        {text("password", t("form.password"), { type: "password", minLength: 10, maxLength: 1024, autoComplete: "new-password" })}
        <div className="field">
          <label htmlFor="add-group">{t("form.group")}</label>
          <select id="add-group" name="group_id" className="select" defaultValue="">
            <option value="">{t("users.noGroup")}</option>
            {groups.map((g) => (
              <option key={g.group_id} value={g.group_id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" name="is_active" defaultChecked />
          {t("form.isActive")}
        </label>
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
