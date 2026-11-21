// Safe to import from the Edge runtime (middleware) and from client code: no Node-only APIs here.

export const COOKIE = {
  access: "tc_access",
  refresh: "tc_refresh",
  tenant: "tc_tenant",
  lang: "tc_lang",
} as const;

export const LANGS = ["id", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "id";

export function parseLang(value: string | undefined | null): Lang {
  return value === "en" ? "en" : DEFAULT_LANG;
}
