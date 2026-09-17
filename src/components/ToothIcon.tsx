/** Lucide has no tooth glyph, so this matches its 24px / 2px-stroke geometry. */
export function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5.5c-1.6-1.2-3-1.8-4.4-1.8C5.1 3.7 3.5 5.5 3.5 8.4c0 1.6.4 3 .9 4.6.5 1.7.7 3 .9 4.7.2 1.7.7 2.6 1.7 2.6 1.1 0 1.5-1 1.8-2.7.3-1.6.5-2.9 1.4-2.9h1.6c.9 0 1.1 1.3 1.4 2.9.3 1.7.7 2.7 1.8 2.7 1 0 1.5-.9 1.7-2.6.2-1.7.4-3 .9-4.7.5-1.6.9-3 .9-4.6 0-2.9-1.6-4.7-4.1-4.7-1.4 0-2.8.6-4.4 1.8Z" />
    </svg>
  );
}
