import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/constants";
import { API_BASE, isSameOrigin, jsonError, writeSession } from "@/lib/server";
import type { TokenResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

interface LoginBody {
  tenant_code?: unknown;
  username?: unknown;
  password?: unknown;
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Cross-origin request refused.");

  let input: LoginBody;
  try {
    input = (await req.json()) as LoginBody;
  } catch {
    return jsonError(400, "invalid_request", "The request body is not valid JSON.");
  }
  const { tenant_code, username, password } = input;
  if (typeof tenant_code !== "string" || typeof username !== "string" || typeof password !== "string") {
    return jsonError(400, "invalid_request", "tenant_code, username and password are required.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Code": tenant_code.trim(),
  };
  // The API rate limits per client address. Pass the browser's address on, otherwise every login would share
  // the address of this server (configure the trusted proxies of the API, see README.md).
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) headers["X-Forwarded-For"] = fwd;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ username: username.trim(), password }),
      cache: "no-store",
    });
  } catch {
    return jsonError(503, "service_unavailable", "The API cannot be reached.");
  }

  if (!upstream.ok) {
    // Pass the API's error envelope (and Retry-After for 429) through unchanged.
    const out: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store" };
    const retry = upstream.headers.get("retry-after");
    if (retry) out["Retry-After"] = retry;
    return new Response(await upstream.text(), { status: upstream.status, headers: out });
  }

  const tokens = (await upstream.json()) as TokenResponse;
  await writeSession(tokens);

  // The tenant code is not a secret; the shell shows it so people know where they are.
  const jar = await cookies();
  jar.set(COOKIE.tenant, tenant_code.trim(), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
