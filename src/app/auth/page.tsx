"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

type Mode = "signin" | "signup";

function signInErrorMessage(errorMessage?: string | null) {
  const message = (errorMessage ?? "").toLowerCase();
  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid_credentials") ||
    message.includes("user not found") ||
    message.includes("email not found")
  ) {
    return "No account found for that email and password. Go to Create account if you're new.";
  }
  if (message.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  return errorMessage || "Couldn't sign in. Check your email and password, or create an account.";
}

function signUpErrorMessage(errorMessage?: string | null) {
  const message = (errorMessage ?? "").toLowerCase();
  if (message.includes("already registered") || message.includes("already exists") || message.includes("user already")) {
    return "An account with this email already exists. Sign in instead.";
  }
  return errorMessage || "Couldn't create account. Please try again.";
}

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, isConfigured, supabase, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "working" | "error" | "confirm">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return;

    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("working");
    setMessage(null);

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      const signedInEmail = data.user?.email?.toLowerCase() ?? null;
      const sessionOk = Boolean(data.session && data.user && signedInEmail === trimmedEmail);

      if (error || !sessionOk) {
        // Avoid leaving a partial/stale session after a failed attempt.
        if (!sessionOk && data.session) {
          await supabase.auth.signOut({ scope: "global" });
        }
        setStatus("error");
        setMessage(signInErrorMessage(error?.message));
        return;
      }

      setStatus("idle");
      router.replace("/timeline");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(signUpErrorMessage(error.message));
      return;
    }

    // Supabase returns a user with empty identities when the email is already taken
    // (to avoid email enumeration), without creating a new session.
    const alreadyRegistered =
      Boolean(data.user) &&
      !data.session &&
      Array.isArray(data.user?.identities) &&
      data.user.identities.length === 0;

    if (alreadyRegistered) {
      setStatus("error");
      setMessage("An account with this email already exists. Sign in instead.");
      setMode("signin");
      return;
    }

    // Supabase may require email confirmation before a session exists.
    if (!data.session) {
      setStatus("confirm");
      setMessage("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    setStatus("idle");
    router.replace("/timeline");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setStatus("idle");
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
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
            {user ? "You are signed in." : mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-secondary">
            {user
              ? "Your account is active on this device."
              : "Use email and password. Quick screenings can still stay anonymous."}
          </p>

          {!isConfigured ? (
            <div className="mt-6 rounded-2xl border border-status-warning/25 bg-status-warning/10 p-4">
              <p className="text-sm font-medium text-status-warning-text">
                Supabase is not configured yet.
              </p>
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
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-card px-5 py-2.5 text-sm font-medium text-ink-secondary"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex gap-1 rounded-full border border-border-subtle bg-surface-page p-1">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    mode === "signin"
                      ? "bg-accent text-accent-ink"
                      : "text-ink-secondary hover:text-ink-primary"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    mode === "signup"
                      ? "bg-accent text-accent-ink"
                      : "text-ink-secondary hover:text-ink-primary"
                  }`}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink-primary" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-full border border-border-subtle bg-surface-page pl-10 pr-4 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-muted focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-ink-primary" htmlFor="password">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      className="h-12 w-full rounded-full border border-border-subtle bg-surface-page pl-10 pr-12 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-muted focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted transition-colors hover:text-ink-primary"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={2.25} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={2.25} />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label
                      className="text-sm font-medium text-ink-primary"
                      htmlFor="confirm-password"
                    >
                      Confirm password
                    </label>
                    <div className="relative mt-2">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter password"
                        className="h-12 w-full rounded-full border border-border-subtle bg-surface-page pl-10 pr-4 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-muted focus:border-accent"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "working"}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {status === "working"
                    ? mode === "signin"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </button>

                {message && (
                  <div className="space-y-2">
                    <p
                      className={`text-sm ${
                        status === "error" ? "text-status-critical-text" : "text-status-good-text"
                      }`}
                    >
                      {message}
                    </p>
                    {status === "error" && mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className="text-sm font-medium text-accent underline-offset-2 hover:underline"
                      >
                        Create account
                      </button>
                    )}
                    {status === "error" && mode === "signup" && (
                      <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className="text-sm font-medium text-accent underline-offset-2 hover:underline"
                      >
                        Sign in instead
                      </button>
                    )}
                  </div>
                )}
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
