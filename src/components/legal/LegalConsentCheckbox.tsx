"use client";

import Link from "next/link";

export function LegalConsentCheckbox({
  id = "legal-consent",
  checked,
  onChange,
  className = "",
}: {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink-secondary ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-border-subtle accent-[var(--accent)]"
      />
      <span>
        I agree to the{" "}
        <Link
          href="/terms"
          className="font-medium text-[#1f7a3f] underline-offset-2 hover:text-[#165c2f] hover:underline"
          target="_blank"
        >
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="font-medium text-[#1f7a3f] underline-offset-2 hover:text-[#165c2f] hover:underline"
          target="_blank"
        >
          Privacy Policy
        </Link>
        , and I understand toothpaste.cv is a visual screening tool only — not a medical diagnosis or dental advice.
      </span>
    </label>
  );
}
