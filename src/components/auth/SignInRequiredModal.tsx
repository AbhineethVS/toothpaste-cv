"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";

export function SignInRequiredModal({
  open,
  title = "Sign in required",
  reason,
  onClose,
}: {
  open: boolean;
  title?: string;
  reason: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink-primary/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-[28px] border border-border-subtle bg-surface-card p-6 shadow-[0_24px_60px_rgba(42,54,71,0.18)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-page hover:text-ink-primary"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Lock className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <h2 id={titleId} className="mt-4 text-xl font-semibold tracking-tight text-ink-primary">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{reason}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border-subtle bg-surface-page px-5 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
          >
            Not now
          </button>
          <Link
            href="/auth"
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
