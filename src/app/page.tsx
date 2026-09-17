import Link from "next/link";

const STEPS = [
  {
    title: "Answer a few prompts",
    detail: "Tell us a bit about your teeth and any concerns you already have.",
  },
  {
    title: "Take 5 quick photos",
    detail: "A guided camera walks you through front, upper, lower, and both side shots.",
  },
  {
    title: "Get your visual report",
    detail: "An instant scorecard flags crowding, wear, discoloration, gum health, and more.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-surface-page">
      <main className="flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-20 text-center sm:py-28">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">
          Free · 2 minutes · No dentist required
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink-primary sm:text-5xl">
          toothpaste.cv
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-ink-secondary">
          A quick oral health screening from your phone. Five photos, one
          instant visual report — so you know if it&apos;s time to see a
          dentist.
        </p>

        <Link
          href="/capture"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-base font-medium text-accent-ink transition-opacity hover:opacity-90"
        >
          Start screening
        </Link>

        <ol className="mt-20 grid w-full gap-6 text-left sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border-subtle bg-surface-card p-5"
            >
              <span className="text-sm font-medium text-ink-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-2 text-base font-semibold text-ink-primary">
                {step.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-secondary">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-16 max-w-md text-xs leading-5 text-ink-muted">
          toothpaste.cv gives a preliminary visual screening only and is not a
          medical diagnosis. Always consult a licensed dentist for advice
          about your oral health.
        </p>
      </main>
    </div>
  );
}
