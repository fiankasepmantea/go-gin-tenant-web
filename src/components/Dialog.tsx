"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

// Native <dialog>: focus is trapped, Escape closes it, and the page behind is inert. Children are only mounted
// while it is open, so every opening starts with fresh form state.
export function Dialog({
  open,
  onClose,
  title,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className={wide ? "dialog dialog-wide" : "dialog"} aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <div className="dialog-body">
          <h2 id={titleId}>{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
