"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthPage() {
  const { user, loading, isConfigured, supabase, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !email.trim()) return;

    setStatus("sending");
    setMessage(null);
    const redirectTo = `${window.location.origin}/timeline`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for a sign-in link.");
  }

  return (
    <div className="theme-capture min-h-screen w-full min-w-0 bg-surface-page text-ink-primary">
      <header className="w-full border-b border-border-subtle bg-surface-page/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            Home
          </Link>
          <p className="text-sm font-semibold text-ink-primary">Account</p>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full min-w-0 max-w-3xl items-center px-4 py-8 sm:px-6">
        <section className="w-full rounded-[28px] border border-border-subtle bg-surface-card p-6 shadow-[0_18px_50px_rgba(42,54,71,0.08)] sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
            Save your oral health timeline.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-secondary">
            Sign in when you want screenings to sync beyond this browser. Quick screenings can still
            stay anonymous.
          </p>

          {!isConfigured ? (
            <div className="mt-6 rounded-2xl border border-status-warning/25 bg-status-warning/10 p-4">
              <p className="text-sm font-medium text-status-warning-text">Supabase is not configured yet.</p>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">
                Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`,
                then restart the dev server.
              </p>
            </div>
          ) : loading ? (
            <p className="mt-6 text-sm text-ink-muted">Checking your session...</p>
          ) : user ? (
            <div className="mt-6 rounded-2xl bg-surface-page p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-status-good-text" strokeWidth={2.25} />
                <div>
                  <p className="text-sm font-medium text-ink-primary">Signed in</p>
                  <p className="mt-1 text-sm text-ink-secondary">{user.email}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/timeline"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink"
                >
                  View timeline
                </Link>
                <button
                  onClick={signOut}
                  className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-card px-5 py-2.5 text-sm font-medium text-ink-secondary"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6">
              <label className="text-sm font-medium text-ink-primary" htmlFor="email">
                Email address
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-full border border-border-subtle bg-surface-page pl-10 pr-4 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-muted focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {status === "sending" ? "Sending..." : "Send link"}
                </button>
              </div>

              {message && (
                <p
                  className={`mt-3 text-sm ${
                    status === "error" ? "text-status-critical-text" : "text-status-good-text"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
