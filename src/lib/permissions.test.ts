import { describe, expect, it } from "vitest";
import { lockoutRisk } from "./permissions";
import type { Endpoint } from "./types";

const ep = (id: string, method: string, path: string): Endpoint => ({ endpoint_id: id, method, path });
const endpoints = [
  ep("1", "GET", "/api/v1/groups"),
  ep("2", "GET", "/api/v1/groups/:id/permissions"),
  ep("3", "PUT", "/api/v1/groups/:id/permissions"),
  ep("4", "GET", "/api/v1/rbac/endpoints"),
  ep("5", "GET", "/api/v1/users"),
];

describe("lockoutRisk", () => {
  it("is empty when every endpoint needed to manage groups stays granted", () => {
    expect(lockoutRisk(endpoints, new Set(["1", "2", "3", "4"]))).toEqual([]);
    expect(lockoutRisk(endpoints, new Set(["1", "2", "3", "4", "5"]))).toEqual([]);
  });

  it("names the essential endpoints that would be removed", () => {
    expect(lockoutRisk(endpoints, new Set(["1", "2"]))).toEqual([
      "PUT /api/v1/groups/:id/permissions",
      "GET /api/v1/rbac/endpoints",
    ]);
  });

  it("does not care about endpoints that are not essential", () => {
    expect(lockoutRisk(endpoints, new Set(["1", "2", "3", "4"]))).toEqual([]);
  });

  it("ignores essential endpoints that are not in the grantable list", () => {
    expect(lockoutRisk([ep("5", "GET", "/api/v1/users")], new Set())).toEqual([]);
  });
});
