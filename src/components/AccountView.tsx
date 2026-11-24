"use client";

import { useState, type FormEvent } from "react";
import { ApiError, bff, logout } from "@/lib/api";
import { ruleText, useI18n } from "@/i18n/provider";
import { PasswordInput } from "./PasswordInput";

// Change the signed-in user's own password. The API ends every session of the user, including this one, so the
// page signs out and sends the user to the login page with a notice.
export function AccountView() {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = String(f.get("new_password") ?? "");
    setError(null);
    setFields({});
    if (next !== String(f.get("confirm") ?? "")) {
      setFields({ confirm: t("reset.mismatch") });
      return;
    }
    setPending(true);
    try {
      await bff("auth/password/change", {
        method: "POST",
        body: JSON.stringify({ current_password: String(f.get("current_password") ?? ""), new_password: next }),
      });
      await logout();
      window.location.assign("/login?notice=password-changed");
    } catch (err) {
      setError(errorText(err));
      if (err instanceof ApiError) {
        const m: Record<string, string> = {};
        for (const d of err.details) m[d.field] = ruleText(t, d.rule);
        setFields(m);
      }
      setPending(false);
    }
  }

  const err = (name: string) =>
    fields[name] ? (
      <span id={`acc-${name}-err`} className="field-error">
        {fields[name]}
      </span>
    ) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t("account.title")}</h1>
          <p className="muted">{t("account.subtitle")}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="account-form">
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="current_password">{t("account.current")}</label>
          <PasswordInput id="current_password" name="current_password" required maxLength={1024} autoComplete="current-password" aria-invalid={fields.current_password ? true : undefined} aria-describedby={fields.current_password ? "acc-current_password-err" : undefined} />
          {err("current_password")}
        </div>
        <div className="field">
          <label htmlFor="new_password">{t("form.password")}</label>
          <PasswordInput id="new_password" name="new_password" required minLength={10} maxLength={1024} autoComplete="new-password" aria-invalid={fields.new_password ? true : undefined} aria-describedby={fields.new_password ? "acc-new_password-err" : undefined} />
          {err("new_password")}
        </div>
        <div className="field">
          <label htmlFor="confirm">{t("reset.confirm")}</label>
          <PasswordInput id="confirm" name="confirm" required minLength={10} maxLength={1024} autoComplete="new-password" aria-invalid={fields.confirm ? true : undefined} aria-describedby={fields.confirm ? "acc-confirm-err" : undefined} />
          {err("confirm")}
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("form.saving") : t("account.submit")}
        </button>
      </form>
    </>
  );
}
