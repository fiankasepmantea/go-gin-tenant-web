"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/lib/api";
import { useI18n } from "@/i18n/provider";
import { LangSwitch } from "./LangSwitch";

export function AppShell({ tenant, children }: { tenant: string; children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();

  async function signOut() {
    await logout();
    window.location.assign("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>{t("app.name")}</strong>
          {tenant && (
            <span className="mono muted">
              {t("shell.tenant")}: {tenant}
            </span>
          )}
        </div>
        <nav className="nav" aria-label={t("nav.label")}>
          <Link href="/users" aria-current={pathname.startsWith("/users") ? "page" : undefined}>
            {t("nav.users")}
          </Link>
          <Link href="/groups" aria-current={pathname.startsWith("/groups") ? "page" : undefined}>
            {t("nav.groups")}
          </Link>
          <Link href="/account" aria-current={pathname.startsWith("/account") ? "page" : undefined}>
            {t("nav.account")}
          </Link>
        </nav>
        <div className="sidebar-foot">
          <LangSwitch />
          <button type="button" className="btn btn-sm" onClick={signOut}>
            {t("nav.signOut")}
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
