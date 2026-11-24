// Pages that can be opened without a session. Everything else sends the visitor to /login first.
const PUBLIC_PAGES = ["/login", "/forgot-password", "/reset-password"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PAGES.some((p) => pathname === p || pathname === `${p}/`);
}
