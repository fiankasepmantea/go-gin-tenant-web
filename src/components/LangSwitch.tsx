"use client";

import { LANGS } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";

// Kept visible on every screen (DESIGN.md, Do's and Don'ts).
export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="seg" role="group" aria-label={t("lang.label")}>
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
