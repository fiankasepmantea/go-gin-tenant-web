"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/lib/api";
import { useI18n } from "@/i18n/provider";
import { AuthCard } from "./AuthCard";

// Same three modes as the login form: the tenant comes from the address (subdomain mode), from a typed code, or,
// on the bare base domain, it is unknown and the visitor is sent to the tenant address.
export function ForgotPasswordForm({ tenant, baseDomain }: { tenant?: string; baseDomain?: string }) {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await forgotPassword(tenant ?? String(data.get("tenant") ?? ""), String(data.get("identifier") ?? ""));
      setSent(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  const back = (
    <Link href="/login" className="btn">
      {t("forgot.back")}
    </Link>
  );

  if (baseDomain && !tenant) {
    return (
      <AuthCard title={t("forgot.title")} help={t("forgot.openTenant", { example: `acme.${baseDomain}` })}>
        {back}
      </AuthCard>
    );
  }

  if (sent) {
    return (
      <AuthCard title={t("forgot.title")}>
        <div className="alert alert-ok" role="status">
          {t("forgot.sent")}
        </div>
        {back}
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("forgot.title")} help={t("forgot.help")}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        {tenant ? (
          <p>
            <span className="muted">{t("login.tenantLabel")}: </span>
            <span className="mono">{tenant}</span>
          </p>
        ) : (
          <div className="field">
            <label htmlFor="tenant">{t("login.tenant")}</label>
            <input id="tenant" name="tenant" className="input mono" required autoCapitalize="none" spellCheck={false} autoComplete="organization" />
          </div>
        )}
        <div className="field">
          <label htmlFor="identifier">{t("forgot.identifier")}</label>
          <input id="identifier" name="identifier" className="input" required maxLength={255} autoCapitalize="none" spellCheck={false} autoComplete="username" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("forgot.submitting") : t("forgot.submit")}
        </button>
        {back}
      </form>
    </AuthCard>
  );
}
