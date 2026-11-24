// Subdomain mode. Server-side only: it reads the environment. No Next.js imports, so it is easy to test.
//
// With TENANT_BASE_DOMAIN=app.example.com the address https://acme.app.example.com means tenant "acme" and the
// login form does not ask for a code. With it empty (the default) the form asks for the code, as before.
// This mirrors SubdomainResolver in the Go API (internal/platform/tenant), including the reserved names.
//
// This variable belongs to the web app. It is separate from the API's own TENANT_BASE_DOMAIN: the web server
// calls the API server to server, so the API never sees the browser's address, and the web app passes the tenant
// on in the X-Tenant-Code header.

// " .App.Example.com. " becomes "app.example.com". Empty means subdomain mode is off.
export function normalizeBase(raw: string | undefined): string {
  return (raw ?? "").trim().toLowerCase().replace(/^\.+|\.+$/g, "");
}

export const TENANT_BASE_DOMAIN = normalizeBase(process.env.TENANT_BASE_DOMAIN);

// Same rule as the tenants.code column of the API.
export const TENANT_CODE_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;

const RESERVED = new Set(["www", "api", "admin", "platform"]);

interface HeaderReader {
  get(name: string): string | null;
}

// The address the browser used. Behind a reverse proxy this is X-Forwarded-Host (the proxy must set it, and
// must overwrite a value sent by the client).
export function requestHost(h: HeaderReader): string | null {
  const forwarded = h.get("x-forwarded-host");
  const raw = forwarded ? (forwarded.split(",")[0] ?? "") : (h.get("host") ?? "");
  return raw.trim() || null;
}

// "acme.app.example.com:3000" with base "app.example.com" gives "acme". Anything else gives null.
export function tenantFromHost(host: string | null | undefined, base: string = TENANT_BASE_DOMAIN): string | null {
  if (!host || !base) return null;

  let h = host.trim().toLowerCase();
  const colon = h.lastIndexOf(":");
  if (colon !== -1 && !h.includes("]")) h = h.slice(0, colon); // drop the port (IPv6 literals are never tenants)
  h = h.replace(/\.$/, "");

  const suffix = `.${base}`;
  if (!h.endsWith(suffix)) return null;

  const label = h.slice(0, h.length - suffix.length);
  if (!label || label.includes(".") || RESERVED.has(label)) return null;
  return TENANT_CODE_RE.test(label) ? label : null;
}
