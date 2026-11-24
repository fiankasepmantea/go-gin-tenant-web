import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/constants";
import { buildCsp } from "@/lib/csp";

// Two jobs, both on every page request:
//  1. Cheap gate: pages other than /login need a session cookie. The real check is the API: an expired or revoked
//     session is answered with 401, and the proxy then clears the cookies so the next navigation lands on /login.
//  2. Content-Security-Policy with a per-request nonce. Next.js puts the nonce on its own scripts when it sees it
//     in the policy of the request, so no inline script runs without it.
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== "/login" && !req.cookies.has(COOKIE.refresh)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const dev = process.env.NODE_ENV !== "production";
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, dev);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set(process.env.CSP_REPORT_ONLY === "true" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Pages only: not API routes, Next static assets, or files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
