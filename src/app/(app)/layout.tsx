import { cookies } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { COOKIE } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  return <AppShell tenant={jar.get(COOKIE.tenant)?.value ?? ""}>{children}</AppShell>;
}
