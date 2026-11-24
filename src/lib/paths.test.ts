import { describe, expect, it } from "vitest";
import { isPublicPath } from "./paths";

describe("isPublicPath", () => {
  it("allows the pages that need no session", () => {
    for (const p of ["/login", "/forgot-password", "/reset-password", "/login/"]) expect(isPublicPath(p), p).toBe(true);
  });

  it("requires a session for everything else", () => {
    for (const p of ["/", "/users", "/groups", "/account", "/login-admin", "/reset-password/x", "/forgot-password-now"]) {
      expect(isPublicPath(p), p).toBe(false);
    }
  });
});
