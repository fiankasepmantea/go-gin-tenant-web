"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { login } from "@/lib/api";
import { useI18n } from "@/i18n/provider";
import { LangSwitch } from "./LangSwitch";
import { PasswordInput } from "./PasswordInput";

const CODE_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;

// Three modes, decided by the server:
//  - no baseDomain: the form asks for the tenant code (default);
//  - baseDomain and tenant: the address names the tenant (acme.app.example.com), shown read-only;
//  - baseDomain without tenant: the address is not a tenant address, so ask for the code and move to its address.
export function LoginForm({
  tenant,
  baseDomain,
  notice,
}: {
  tenant?: string;
  baseDomain?: string;
  notice?: "password-reset" | "password-changed";
}) {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      // In subdomain mode the server takes the tenant from the address and ignores this value.
      await login(tenant ?? String(data.get("tenant") ?? ""), String(data.get("username") ?? ""), String(data.get("password") ?? ""));
      window.location.assign("/users"); // full navigation so the server reads the new cookies
    } catch (err) {
      setError(errorText(err));
      setPending(false);
    }
  }

  if (baseDomain && !tenant) {
    return (
      <main className="login">
        <FindTenant baseDomain={baseDomain} />
      </main>
    );
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-head">
          <div>
            <p className="login-brand">{t("app.name")}</p>
            <h1>{t("login.title")}</h1>
          </div>
          <LangSwitch />
        </div>
        <p className="muted">{t("login.subtitle")}</p>

        {notice && (
          <div className="alert alert-ok" role="status">
            {t(notice === "password-reset" ? "login.noticeReset" : "login.noticeChanged")}
          </div>
        )}
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
            <input id="tenant" name="tenant" className="input mono" autoComplete="organization" required autoCapitalize="none" spellCheck={false} />
          </div>
        )}
        <div className="field">
          <label htmlFor="username">{t("login.username")}</label>
          <input id="username" name="username" className="input" autoComplete="username" required autoCapitalize="none" spellCheck={false} />
        </div>
        <div className="field">
          <label htmlFor="password">{t("login.password")}</label>
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
        </div>

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("login.submitting") : t("login.submit")}
        </button>
        <Link href="/forgot-password" className="login-forgot">
          {t("login.forgot")}
        </Link>
      </form>
    </main>
  );
}

function FindTenant({ baseDomain }: { baseDomain: string }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("tenant") ?? "").trim().toLowerCase();
    if (!CODE_RE.test(code)) {
      setError(t("login.findInvalid"));
      return;
    }
    const { protocol, port } = window.location;
    window.location.assign(`${protocol}//${code}.${baseDomain}${port ? `:${port}` : ""}/login`);
  }

  return (
    <form className="login-card" onSubmit={onSubmit}>
      <div className="login-head">
        <div>
          <p className="login-brand">{t("app.name")}</p>
          <h1>{t("login.findTitle")}</h1>
        </div>
        <LangSwitch />
      </div>
      <p className="muted">{t("login.findHelp", { example: `acme.${baseDomain}` })}</p>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <div className="field">
        <label htmlFor="tenant">{t("login.tenant")}</label>
        <input id="tenant" name="tenant" className="input mono" required autoCapitalize="none" spellCheck={false} autoComplete="organization" />
      </div>
      <button type="submit" className="btn btn-primary">
        {t("login.findGo")}
      </button>
    </form>
  );
}
