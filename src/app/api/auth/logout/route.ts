import { NextRequest, NextResponse } from "next/server";
import { API_BASE, clearSession, isSameOrigin, jsonError, readSession } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Cross-origin request refused.");

  const { refresh } = await readSession();
  if (refresh) {
    // Best effort and idempotent on the API side: the local session ends even if the API is unreachable.
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
        cache: "no-store",
      });
    } catch {
      /* ignored on purpose */
    }
  }
  await clearSession();
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
