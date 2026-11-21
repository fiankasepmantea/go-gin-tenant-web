"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useI18n } from "@/i18n/provider";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

// A password field with an eye button. The value is always submitted as typed; the button only switches the
// input between type="password" and type="text". It starts hidden, and goes back to hidden when the form
// (for example a dialog) is closed, because the component is unmounted with it.
export function PasswordInput(props: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const label = visible ? t("form.hidePassword") : t("form.showPassword");

  return (
    <div className="pw">
      <input {...props} type={visible ? "text" : "password"} className="input" />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        {visible ? (
          // eye with a slash: the password is visible, click to hide it
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c5 0 9 6 9 6a16.6 16.6 0 0 1-3.2 3.7" />
            <path d="M6.6 6.6C4.2 8.2 3 12 3 12s4 6 9 6a9.7 9.7 0 0 0 4-.9" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          // open eye: the password is hidden, click to show it
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
