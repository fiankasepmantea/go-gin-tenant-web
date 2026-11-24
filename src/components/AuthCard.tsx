"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/i18n/provider";
import { LangSwitch } from "./LangSwitch";

// The card shared by the pages that need no session (forgot and reset password): brand, title and language switch.
export function AuthCard({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="login">
      <div className="login-card">
        <div className="login-head">
          <div>
            <p className="login-brand">{t("app.name")}</p>
            <h1>{title}</h1>
          </div>
          <LangSwitch />
        </div>
        {help && <p className="muted">{help}</p>}
        {children}
      </div>
    </main>
  );
}
