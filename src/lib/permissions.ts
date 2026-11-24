import type { Endpoint } from "./types";

// What the Groups and Permissions pages themselves call. A group that loses these can no longer be managed
// from this console, so an admin may not remove them from the group of their own account (it would lock them out).
export const ESSENTIAL = [
  "GET /api/v1/groups",
  "GET /api/v1/groups/:id/permissions",
  "PUT /api/v1/groups/:id/permissions",
  "GET /api/v1/rbac/endpoints",
] as const;

// The essential endpoints that exist in the grantable list but are not in `selected`. Empty means the change is safe.
export function lockoutRisk(endpoints: Endpoint[], selected: ReadonlySet<string>): string[] {
  const missing: string[] = [];
  for (const label of ESSENTIAL) {
    const e = endpoints.find((x) => `${x.method} ${x.path}` === label);
    if (e && !selected.has(e.endpoint_id)) missing.push(label);
  }
  return missing;
}
