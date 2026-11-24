import type { Metadata } from "next";
import { headers } from "next/headers";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { requestHost, tenantFromHost, TENANT_BASE_DOMAIN } from "@/lib/tenant";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  const tenant = TENANT_BASE_DOMAIN ? tenantFromHost(requestHost(await headers())) : null;
  return <ForgotPasswordForm baseDomain={TENANT_BASE_DOMAIN || undefined} tenant={tenant ?? undefined} />;
}
