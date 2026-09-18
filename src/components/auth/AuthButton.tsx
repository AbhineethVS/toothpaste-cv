"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthButton({ className = "" }: { className?: string }) {
  const { user, loading, isConfigured, signOut } = useAuth();

  if (!isConfigured) {
    return (
      <Link
        href="/auth"
        className={`inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary ${className}`}
      >
        <LogIn className="h-4 w-4" strokeWidth={2.25} />
        Sign in
      </Link>
    );
  }

  if (loading) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-ink-muted ${className}`}
      >
        <UserRound className="h-4 w-4" strokeWidth={2.25} />
        Checking
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className={`inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary ${className}`}
      >
        <LogIn className="h-4 w-4" strokeWidth={2.25} />
        Sign in
      </Link>
    );
  }

  return (
    <button
      onClick={signOut}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary ${className}`}
      title={user.email ?? "Signed in"}
    >
      <LogOut className="h-4 w-4" strokeWidth={2.25} />
      Sign out
    </button>
  );
}
