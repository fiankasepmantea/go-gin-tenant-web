// Server-only helpers: talking to the Go API and managing the session cookies.
// Never import this file from a client component.
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { COOKIE } from "./constants";
import type { TokenResponse } from "./types";

export const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/+$/, "");
export const API_BASE = `${API_URL}/api/v1`;

const IS_PROD = process.env.NODE_ENV === "production";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // the API rejects the token earlier if its TTL is shorter

export async function readSession(): Promise<{ access?: string; refresh?: string }> {
  const jar = await cookies();
  return { access: jar.get(COOKIE.access)?.value, refresh: jar.get(COOKIE.refresh)?.value };
}

export async function writeSession(tokens: TokenResponse): Promise<void> {
  const jar = await cookies();
  const base = { httpOnly: true, sameSite: "lax" as const, secure: IS_PROD, path: "/" };
  // The access cookie expires slightly before the token does, so the proxy refreshes before the API says 401.
  jar.set(COOKIE.access, tokens.access_token, { ...base, maxAge: Math.max(tokens.expires_in - 10, 1) });
  jar.set(COOKIE.refresh, tokens.refresh_token, { ...base, maxAge: REFRESH_COOKIE_MAX_AGE });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE.access);
  jar.delete(COOKIE.refresh);
  jar.delete(COOKIE.tenant);
}

// Refresh tokens are single use and the API revokes every session of a user when one is presented twice.
// Several browser requests can notice an expired access token at the same moment (users, groups and /auth/me
// load in parallel), so refreshes are shared per refresh token and the result is remembered for a short time
// for requests that were already in flight with the old cookie.
const SHARE_MS = 30_000;
const inflight = new Map<string, Promise<TokenResponse | null>>();

export function refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;

  const p = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
      if (!res.ok) return null;
      return (await res.json()) as TokenResponse;
    } catch {
      return null;
    }
  })();

  inflight.set(refreshToken, p);
  setTimeout(() => inflight.delete(refreshToken), SHARE_MS).unref?.();
  return p;
}

// Cross-site request guard for the cookie-authenticated endpoints of this app. SameSite=Lax already stops
// cross-site POSTs from carrying the cookies; this check also rejects a mismatching Origin explicitly.
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin GET requests and non-browser clients send none
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(status: number, code: string, message: string, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify({ success: false, code: status, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

// POST to an API endpoint that needs no session (forgot and reset password). The API's answer is passed through
// unchanged, including its error envelope and Retry-After. The browser's address goes on in X-Forwarded-For because
// the API rate limits per client address (see README.md, trusted proxies).
export async function publicPost(
  req: NextRequest,
  path: string,
  payload: unknown,
  extra: Record<string, string> = {},
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) headers["X-Forwarded-For"] = fwd;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: JSON.stringify(payload), cache: "no-store" });
  } catch {
    return jsonError(503, "service_unavailable", "The API cannot be reached.");
  }

  const out: Record<string, string> = { "Cache-Control": "no-store" };
  const ct = upstream.headers.get("content-type");
  if (ct) out["Content-Type"] = ct;
  const retry = upstream.headers.get("retry-after");
  if (retry) out["Retry-After"] = retry;
  const reqId = upstream.headers.get("x-request-id");
  if (reqId) out["X-Request-Id"] = reqId;

  if (upstream.status === 204) return new Response(null, { status: 204, headers: out });
  return new Response(await upstream.text(), { status: upstream.status, headers: out });
}
