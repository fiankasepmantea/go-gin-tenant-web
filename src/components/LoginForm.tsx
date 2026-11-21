"use client";

import { useState, type FormEvent } from "react";
import { login } from "@/lib/api";
import { useI18n } from "@/i18n/provider";
import { LangSwitch } from "./LangSwitch";

export function LoginForm() {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await login(String(data.get("tenant") ?? ""), String(data.get("username") ?? ""), String(data.get("password") ?? ""));
      window.location.assign("/users"); // full navigation so the server reads the new cookies
    } catch (err) {
      setError(errorText(err));
      setPending(false);
    }
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-lang">
          <LangSwitch />
        </div>
        <div>
          <h1>{t("login.title")}</h1>
          <p className="muted">{t("login.subtitle")}</p>
        </div>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="tenant">{t("login.tenant")}</label>
          <input id="tenant" name="tenant" className="input mono" autoComplete="organization" required autoCapitalize="none" spellCheck={false} />
        </div>
        <div className="field">
          <label htmlFor="username">{t("login.username")}</label>
          <input id="username" name="username" className="input" autoComplete="username" required autoCapitalize="none" spellCheck={false} />
        </div>
        <div className="field">
          <label htmlFor="password">{t("login.password")}</label>
          <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
        </div>

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </main>
  );
}
