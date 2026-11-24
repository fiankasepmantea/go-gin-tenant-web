import { NextRequest } from "next/server";
import { isSameOrigin, jsonError, publicPost } from "@/lib/server";

export const dynamic = "force-dynamic";

// The token from the e-mail identifies the tenant and the account, so no tenant is needed here.
export async function POST(req: NextRequest): Promise<Response> {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Cross-origin request refused.");

  let input: { token?: unknown; new_password?: unknown };
  try {
    input = (await req.json()) as typeof input;
  } catch {
    return jsonError(400, "invalid_request", "The request body is not valid JSON.");
  }
  if (typeof input.token !== "string" || typeof input.new_password !== "string") {
    return jsonError(400, "invalid_request", "token and new_password are required.");
  }

  return publicPost(req, "/auth/password/reset", { token: input.token, new_password: input.new_password });
}
