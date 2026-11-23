import type { Metadata } from "next";
import { headers } from "next/headers";
import { LoginForm } from "@/components/LoginForm";
import { requestHost, tenantFromHost, TENANT_BASE_DOMAIN } from "@/lib/tenant";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const tenant = TENANT_BASE_DOMAIN ? tenantFromHost(requestHost(await headers())) : null;
  return <LoginForm baseDomain={TENANT_BASE_DOMAIN || undefined} tenant={tenant ?? undefined} />;
}
