import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function LegalDocLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
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
          <p className="text-sm font-semibold text-ink-primary">{title}</p>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <article className="rounded-[28px] border border-border-subtle bg-surface-card p-6 shadow-[0_18px_50px_rgba(42,54,71,0.08)] sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">Last updated: {updated}</p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-ink-secondary">{children}</div>
        </article>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
