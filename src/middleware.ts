import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/constants";

// Cheap gate: pages other than /login need a session cookie. The real check is the API: an expired or revoked
// session is answered with 401, and the proxy then clears the cookies so the next navigation lands on /login.
export function middleware(req: NextRequest) {
  if (!req.cookies.has(COOKIE.refresh)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the login page, API routes, Next internals and static files.
  matcher: ["/((?!login|api|_next|favicon\\.ico|.*\\..*).*)"],
};
