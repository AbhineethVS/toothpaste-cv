"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const BASE_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary sm:px-4";

export function AuthButton({ className = "" }: { className?: string }) {
  const { user, loading, isConfigured, signOut } = useAuth();

  if (!isConfigured) {
    return (
      <Link href="/auth" className={`${BASE_CLASS} ${className}`.trim()}>
        <LogIn className="h-4 w-4" strokeWidth={2.25} />
        Sign in
      </Link>
    );
  }

  if (loading) {
    return (
      <span className={`${BASE_CLASS} text-ink-muted ${className}`.trim()}>
        <UserRound className="h-4 w-4" strokeWidth={2.25} />
        Checking
      </span>
    );
  }

  if (!user) {
    return (
      <Link href="/auth" className={`${BASE_CLASS} ${className}`.trim()}>
        <LogIn className="h-4 w-4" strokeWidth={2.25} />
        Sign in
      </Link>
    );
  }

  return (
    <button
      onClick={signOut}
      className={`${BASE_CLASS} ${className}`.trim()}
      title={user.email ?? "Signed in"}
    >
      <LogOut className="h-4 w-4" strokeWidth={2.25} />
      Sign out
    </button>
  );
}
