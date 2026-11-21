"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { Dialog } from "./Dialog";

export function ConfirmDialog({
  open,
  title,
  body,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const { t, errorText } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p>{body}</p>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onClose}>
          {t("form.cancel")}
        </button>
        <button type="button" className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={run} disabled={pending}>
          {t("form.confirm")}
        </button>
      </div>
    </Dialog>
  );
}
