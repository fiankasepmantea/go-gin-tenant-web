import { NextRequest } from "next/server";
import { isSameOrigin, jsonError, publicPost } from "@/lib/server";
import { tenantForRequest, TENANT_BASE_DOMAIN } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// The API always answers 202 with the same text, whether or not the account exists, so this route does too.
export async function POST(req: NextRequest): Promise<Response> {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Cross-origin request refused.");

  let input: { tenant_code?: unknown; identifier?: unknown };
  try {
    input = (await req.json()) as typeof input;
  } catch {
    return jsonError(400, "invalid_request", "The request body is not valid JSON.");
  }
  if (typeof input.identifier !== "string" || input.identifier.trim() === "") {
    return jsonError(400, "invalid_request", "identifier is required.");
  }

  const tenant = tenantForRequest(req.headers, input.tenant_code);
  if (!tenant) {
    return TENANT_BASE_DOMAIN
      ? jsonError(400, "invalid_request", "Open this page on the address of your tenant.")
      : jsonError(400, "invalid_request", "tenant_code is required.");
  }

  return publicPost(req, "/auth/password/forgot", { tenant_code: tenant, identifier: input.identifier.trim() }, { "X-Tenant-Code": tenant });
}
