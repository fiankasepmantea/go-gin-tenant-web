// Browser-side client for the same-origin proxy (src/app/api/bff). It never handles tokens.
import type { ErrorEnvelope, FieldDetail } from "./types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: FieldDetail[] = [],
    readonly requestId?: string,
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let env: Partial<ErrorEnvelope> | null = null;
  try {
    env = (await res.json()) as Partial<ErrorEnvelope>;
  } catch {
    /* not JSON */
  }
  const retry = Number(res.headers.get("retry-after"));
  return new ApiError(
    res.status,
    env?.error?.code ?? "internal_error",
    env?.error?.message ?? res.statusText,
    env?.error?.details ?? [],
    res.headers.get("x-request-id") ?? undefined,
    Number.isFinite(retry) && retry > 0 ? retry : undefined,
  );
}

function redirectToLogin(): void {
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

// Calls the Go API through the proxy and returns the parsed JSON body (undefined for 204).
// A JSON string body gets a JSON content type; FormData is sent as it is so the browser adds the boundary.
export async function bff<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const res = await fetch(`/api/bff/${path}`, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  if (res.status === 401) {
    redirectToLogin();
    throw await parseError(res);
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function bffBlob(path: string): Promise<Blob> {
  const res = await fetch(`/api/bff/${path}`, { credentials: "same-origin", cache: "no-store" });
  if (res.status === 401) redirectToLogin();
  if (!res.ok) throw await parseError(res);
  return res.blob();
}

// The login route is not under /api/bff because it has no session yet.
export async function login(tenantCode: string, username: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant_code: tenantCode, username, password }),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}

// Forgot and reset password need no session, so they go to their own routes, like login. The API answers forgot
// with 202 whether or not the account exists, so a success here says nothing about the account.
async function postPublic(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
}

export function forgotPassword(tenantCode: string, identifier: string): Promise<void> {
  return postPublic("/api/auth/password/forgot", { tenant_code: tenantCode, identifier });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return postPublic("/api/auth/password/reset", { token, new_password: newPassword });
}
