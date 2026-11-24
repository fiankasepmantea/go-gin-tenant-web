"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError, resetPassword } from "@/lib/api";
import { ruleText, useI18n } from "@/i18n/provider";
import { AuthCard } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";

// Opened from the link in the e-mail (/reset-password?token=...). The token is only sent to this app's own route.
export function ResetPasswordForm({ token }: { token?: string }) {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(!token);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const f = new FormData(e.currentTarget);
    const next = String(f.get("new_password") ?? "");
    setError(null);
    setFieldError(null);
    if (next !== String(f.get("confirm") ?? "")) {
      setFieldError(t("reset.mismatch"));
      return;
    }
    setPending(true);
    try {
      await resetPassword(token, next);
      window.location.assign("/login?notice=password-reset");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.code === "invalid_request") {
        setInvalid(true); // the link is wrong or expired; more attempts with it are pointless
      } else {
        setError(errorText(err));
        if (err instanceof ApiError) {
          const d = err.details.find((x) => x.field === "new_password");
          if (d) setFieldError(ruleText(t, d.rule));
        }
      }
      setPending(false);
    }
  }

  if (invalid) {
    return (
      <AuthCard title={t("reset.title")}>
        <div className="alert" role="alert">
          {t("reset.invalid")}
        </div>
        <Link href="/forgot-password" className="btn btn-primary">
          {t("reset.askNew")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("reset.title")} help={t("reset.help")}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="new_password">{t("form.password")}</label>
          <PasswordInput id="new_password" name="new_password" required minLength={10} maxLength={1024} autoComplete="new-password" aria-invalid={fieldError ? true : undefined} aria-describedby={fieldError ? "reset-err" : undefined} />
        </div>
        <div className="field">
          <label htmlFor="confirm">{t("reset.confirm")}</label>
          <PasswordInput id="confirm" name="confirm" required minLength={10} maxLength={1024} autoComplete="new-password" />
          {fieldError && (
            <span id="reset-err" className="field-error">
              {fieldError}
            </span>
          )}
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("reset.submitting") : t("reset.submit")}
        </button>
      </form>
    </AuthCard>
  );
}
