import { describe, expect, it } from "vitest";
import { normalizeBase, requestHost, tenantFromHost } from "./tenant";

const BASE = "app.example.com";

describe("tenantFromHost", () => {
  it("reads the tenant from a single label in front of the base domain", () => {
    expect(tenantFromHost("acme.app.example.com", BASE)).toBe("acme");
  });

  it("ignores case, a port and a trailing dot", () => {
    expect(tenantFromHost("ACME.app.example.com:3000", BASE)).toBe("acme");
    expect(tenantFromHost("acme.app.example.com.", BASE)).toBe("acme");
  });

  it("works with localhost for local development", () => {
    expect(tenantFromHost("acme.localhost:3000", "localhost")).toBe("acme");
  });

  it("returns null for the bare base domain", () => {
    expect(tenantFromHost("app.example.com", BASE)).toBeNull();
  });

  it("returns null for nested labels, so a.b.<base> is not tenant b or a", () => {
    expect(tenantFromHost("a.b.app.example.com", BASE)).toBeNull();
  });

  it("returns null for reserved names", () => {
    for (const name of ["www", "api", "admin", "platform"]) {
      expect(tenantFromHost(`${name}.app.example.com`, BASE)).toBeNull();
    }
  });

  it("returns null for hosts that only look similar", () => {
    expect(tenantFromHost("evilapp.example.com", BASE)).toBeNull();
    expect(tenantFromHost("acme.app.example.com.evil.com", BASE)).toBeNull();
    expect(tenantFromHost("acme.example.com", BASE)).toBeNull();
  });

  it("returns null when the label is not a valid tenant code", () => {
    expect(tenantFromHost("x.app.example.com", BASE)).toBeNull(); // one character
    expect(tenantFromHost("-acme.app.example.com", BASE)).toBeNull(); // starts with a hyphen
    expect(tenantFromHost("ac_me.app.example.com", BASE)).toBeNull(); // underscore
  });

  it("returns null without a host or without a base domain", () => {
    expect(tenantFromHost(null, BASE)).toBeNull();
    expect(tenantFromHost("", BASE)).toBeNull();
    expect(tenantFromHost("acme.app.example.com", "")).toBeNull();
  });
});

describe("requestHost", () => {
  const headers = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });

  it("prefers the first X-Forwarded-Host value", () => {
    expect(requestHost(headers({ "x-forwarded-host": "a.x.com, b.com", host: "internal:3000" }))).toBe("a.x.com");
  });

  it("falls back to Host", () => {
    expect(requestHost(headers({ host: "acme.localhost:3000" }))).toBe("acme.localhost:3000");
  });

  it("returns null when there is no host", () => {
    expect(requestHost(headers({}))).toBeNull();
  });
});

describe("normalizeBase", () => {
  it("trims, lowercases and strips surrounding dots", () => {
    expect(normalizeBase("  .App.Example.com. ")).toBe("app.example.com");
  });

  it("treats a missing or blank value as subdomain mode off", () => {
    expect(normalizeBase(undefined)).toBe("");
    expect(normalizeBase("   ")).toBe("");
  });
});
