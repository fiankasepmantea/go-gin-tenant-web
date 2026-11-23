// Same-origin proxy to the Go API. The browser never sees the tokens: they live in httpOnly cookies, and this
// handler adds the Authorization header, refreshes an expired access token once, and rewrites the cookies.
import { NextRequest, NextResponse } from "next/server";
import {
  API_BASE,
  clearSession,
  isSameOrigin,
  jsonError,
  readSession,
  refreshTokens,
  writeSession,
} from "@/lib/server";
import type { TokenResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// Only the resources the console uses. Anything else is a 404 here, even if the API has it.
const ALLOWED = [/^users(\/.*)?$/, /^groups(\/.*)?$/, /^rbac\/endpoints$/, /^auth\/me$/];

const PASS_HEADERS = ["content-type", "content-disposition", "retry-after", "x-request-id"];

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Cross-origin request refused.");

  const { path } = await ctx.params;
  if (path.some((s) => s === "." || s === ".." || s.includes("/") || s.includes("\\"))) {
    return jsonError(404, "not_found", "Not found.");
  }
  const sub = path.join("/");
  if (!ALLOWED.some((re) => re.test(sub))) return jsonError(404, "not_found", "Not found.");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined; // buffered so the call can be repeated after a refresh

  const call = (access: string) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${access}` };
    const ct = req.headers.get("content-type");
    if (ct) headers["Content-Type"] = ct;
    const accept = req.headers.get("accept");
    if (accept) headers["Accept"] = accept;
    return fetch(`${API_BASE}/${sub}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  };

  const session = await readSession();
  let access = session.access;
  let renewed: TokenResponse | null = null;

  if (!access && session.refresh) {
    renewed = await refreshTokens(session.refresh);
    access = renewed?.access_token;
  }
  if (!access) {
    await clearSession();
    return jsonError(401, "unauthorized", "Authentication is required.");
  }

  let upstream: Response;
  try {
    upstream = await call(access);
    if (upstream.status === 401 && session.refresh && !renewed) {
      renewed = await refreshTokens(session.refresh);
      if (renewed) upstream = await call(renewed.access_token);
    }
  } catch {
    return jsonError(503, "service_unavailable", "The API cannot be reached.");
  }

  if (renewed) {
    await writeSession(renewed);
  } else if (upstream.status === 401) {
    await clearSession();
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of PASS_HEADERS) {
    const v = upstream.headers.get(name);
    if (v) headers.set(name, v);
  }

  if (upstream.status === 204 || upstream.status === 304) {
    return new NextResponse(null, { status: upstream.status, headers });
  }
  return new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers });
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
