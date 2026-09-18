"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const BASE_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-sm font-medium text-ink-secondary shadow-[0_8px_24px_rgba(42,54,71,0.06)] transition-colors hover:text-ink-primary sm:px-4";

/** Dashboard shortcut — only visible when the user is signed in. */
export function TimelineNavButton({ className = "" }: { className?: string }) {
  const { user, loading, isConfigured } = useAuth();

  if (!isConfigured || loading || !user) return null;

  return (
    <Link href="/timeline" className={`${BASE_CLASS} ${className}`.trim()}>
      <Clock3 className="h-4 w-4" strokeWidth={2.25} />
      Timeline
    </Link>
  );
}
