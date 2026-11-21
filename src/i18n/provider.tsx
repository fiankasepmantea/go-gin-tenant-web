"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { COOKIE, type Lang } from "@/lib/constants";
import { ApiError } from "@/lib/api";
import { messages, type MessageKey } from "./messages";

type Vars = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  // Turns an API error into a message in the current language.
  errorText: (err: unknown) => string;
}

const Ctx = createContext<I18n | null>(null);

function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.lang = next;
    // Not httpOnly on purpose: the server reads it to render the right language on the first paint.
    document.cookie = `${COOKIE.lang}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = messages[lang];
    const t = (key: MessageKey, vars?: Vars) => format(dict[key], vars);
    const errorText = (err: unknown): string => {
      if (!(err instanceof ApiError)) return t("error.generic");
      const key = `error.${err.code}` as MessageKey;
      let text = key in dict ? t(key, { seconds: err.retryAfter ?? 60 }) : err.message || t("error.generic");
      if (err.status >= 500 && err.requestId) text += ` (${t("error.requestId", { id: err.requestId })})`;
      return text;
    };
    return { lang, setLang, t, errorText };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}

// Localizes a validation rule name from the API ("min", "taken", ...); unknown rules are shown as they are.
export function ruleText(t: I18n["t"], rule: string): string {
  const key = `rule.${rule}` as MessageKey;
  return key in messages.id ? t(key) : rule;
}
