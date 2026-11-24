import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `));

describe("buildCsp (production)", () => {
  const csp = buildCsp("abc123", false);

  it("lets only scripts with the request's nonce run", () => {
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it("does not allow eval or inline scripts", () => {
    expect(csp).not.toContain("'unsafe-eval'");
    expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");
  });

  it("only talks to its own origin", () => {
    expect(directive(csp, "connect-src")).toBe("connect-src 'self'");
    expect(directive(csp, "default-src")).toBe("default-src 'self'");
  });

  it("blocks plugins, framing, foreign base URLs and foreign form targets", () => {
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("uses the nonce it is given, so two requests get two policies", () => {
    expect(buildCsp("one", false)).not.toBe(buildCsp("two", false));
  });
});

describe("buildCsp (development)", () => {
  const csp = buildCsp("abc123", true);

  it("adds only what hot reload needs", () => {
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "connect-src")).toBe("connect-src 'self' ws: wss:");
  });
});
