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
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-20 text-center sm:py-28">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium tracking-wide text-emerald-800 uppercase dark:bg-emerald-950 dark:text-emerald-300">
          Free · 2 minutes · No dentist required
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
          toothpaste.cv
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          A quick oral health screening from your phone. Five photos, one
          instant visual report — so you know if it&apos;s time to see a
          dentist.
        </p>

        <Link
          href="/capture"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Start screening
        </Link>

        <ol className="mt-20 grid w-full gap-6 text-left sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="text-sm font-medium text-zinc-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {step.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-16 max-w-md text-xs leading-5 text-zinc-400">
          toothpaste.cv gives a preliminary visual screening only and is not a
          medical diagnosis. Always consult a licensed dentist for advice
          about your oral health.
        </p>
      </main>
    </div>
  );
}
