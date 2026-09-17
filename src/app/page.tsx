import Link from "next/link";
import {
  ArrowRight,
  Activity,
  BadgeCheck,
  Camera,
  CalendarCheck,
  CheckCircle2,
  Circle,
  CircleDot,
  ClipboardCheck,
  Columns3,
  Eye,
  Info,
  Layers,
  Leaf,
  Lock,
  PlayCircle,
  Ruler,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { DIAGNOSTIC_DEFS, type FindingKey } from "@/lib/analysis-schema";

const DETECTION_ICONS: Record<FindingKey, typeof Columns3> = {
  crowding: Columns3,
  wear: Layers,
  discoloration: Sparkles,
  gumHealth: Leaf,
  plaque: CircleDot,
  biteAlignment: Ruler,
  spacing: ArrowRight,
  chipsOrFractures: TriangleAlert,
  possibleDecay: Activity,
};

type PreviewTone = "success" | "warning" | "danger";

const PREVIEW_TONE_CLASSES: Record<PreviewTone, string> = {
  success: "bg-lp-status-success/15 text-lp-status-success",
  warning: "bg-lp-status-warning/15 text-lp-status-warning",
  danger: "bg-lp-status-danger/15 text-lp-status-danger",
};

const PREVIEW_FINDINGS: { key: FindingKey; tag: string; tone: PreviewTone; detail: string }[] = [
  { key: "crowding", tag: "Mild crowding", tone: "warning", detail: "Slight lower front rotation" },
  { key: "wear", tag: "Minimal", tone: "success", detail: "Normal incisal edges" },
  { key: "discoloration", tag: "Surface staining", tone: "warning", detail: "Light staining, upper front" },
  { key: "gumHealth", tag: "Healthy line", tone: "success", detail: "Firm margins, no swelling" },
  { key: "chipsOrFractures", tag: "None observed", tone: "success", detail: "Enamel edges intact" },
  { key: "possibleDecay", tag: "1 area flagged", tone: "danger", detail: "Dark pit on upper right molar" },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    icon: Camera,
    iconClass: "text-lp-secondary",
    title: "Take 5 guided photos",
    detail:
      "On-screen framing guides and a live viewfinder walk you through front, upper, lower, and both side shots.",
    meta: "About a minute",
    metaIcon: Zap,
  },
  {
    number: "02",
    icon: ClipboardCheck,
    iconClass: "text-lp-tertiary",
    title: "Get your visual report",
    detail:
      "Instantly see classified visual flags across 9 oral health categories, with plain-English explanations for each.",
    meta: "Results in seconds",
    metaIcon: Sparkles,
  },
];

const TOOTHPASTE_PROVIDES = [
  "Immediate preliminary screening of visible outer enamel and smile architecture.",
  "Identification of visual irregularities that warrant clinical consultation.",
  "Objective tracking of surface staining and alignment shifts over time.",
  "Empowering questions to ask your dentist during routine preventative visits.",
];

const REQUIRES_DENTIST = [
  "Sub-surface decay evaluation and interproximal cavities requiring digital bitewing X-rays.",
  "Periodontal pocket depth measurements below the gum line via clinical probing.",
  "Root canal pathology, nerve vitality testing, and internal resorption analysis.",
  "Prescription of treatment plans, restorative fillings, crowns, or orthodontic movement.",
];

export default function Home() {
  return (
    <div className="theme-obsidian flex flex-1 flex-col bg-lp-surface font-lp-body text-lp-text-primary">
      <header className="sticky top-0 z-50 border-b border-lp-border-subtle bg-lp-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-lp-heading text-lg font-bold tracking-tight">
              toothpaste<span className="text-lp-tertiary">.cv</span>
            </span>
            <div className="hidden items-center gap-1.5 rounded-full border border-lp-border-subtle bg-lp-surface-container-high px-2.5 py-1 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lp-secondary" />
              <span className="font-lp-heading text-[11px] font-semibold uppercase tracking-wider text-lp-text-secondary">
                v1 MVP · 2-min triage
              </span>
            </div>
          </div>
          <Link
            href="/capture"
            className="inline-flex items-center justify-center rounded-full bg-lp-primary-container px-4 py-2 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-colors hover:bg-lp-primary"
          >
            Start Screening
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative w-full overflow-hidden px-5 py-16 sm:px-6 sm:py-24">
          <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[340px] w-[720px] -translate-x-1/2 bg-gradient-to-b from-lp-primary-container/20 via-lp-tertiary/10 to-transparent blur-[120px]" />
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-lp-surface-container-high/80 px-4 py-1.5 shadow-md backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lp-secondary shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-lp-heading text-[11px] font-semibold uppercase tracking-wider text-lp-primary">
                Free · ~2 minutes · smartphone or web
              </span>
            </div>

            <h1 className="mb-4 max-w-3xl font-lp-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Instant oral health screening
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-lp-text-primary via-lp-primary to-lp-tertiary bg-clip-text text-transparent">
                {" "}from your phone.
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-8 text-lp-text-secondary">
              Five guided photos, instant computer vision analysis, and a clear visual
              scorecard — so you know whether it&apos;s time to book a dentist.
            </p>

            <div className="mb-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/capture"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-primary-container px-8 py-4 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-xl transition-all duration-300 hover:bg-lp-primary hover:shadow-[0_0_28px_rgba(59,130,246,0.45)] sm:w-auto"
              >
                Start Free Screening
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#preview"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-surface-container-high px-6 py-4 font-lp-heading text-sm font-semibold text-lp-text-primary shadow-md transition-colors hover:bg-lp-surface-container sm:w-auto"
              >
                <Eye className="h-4 w-4 text-lp-tertiary" />
                See Sample Report
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-lp-text-muted">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-lp-secondary" />
                No account required
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-lp-secondary" />
                Zero photos stored permanently
              </span>
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-lp-tertiary" />
                Triage, not medical diagnosis
              </span>
            </div>
          </div>
        </section>

        <section id="preview" className="relative mx-auto w-full max-w-6xl px-5 py-10 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-lp-surface-card p-5 shadow-2xl sm:p-8">
            <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-lp-primary/10 blur-3xl" />
            <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-lp-surface-container-high px-2.5 py-1 font-mono text-xs text-lp-tertiary">
                  SAMPLE PREVIEW
                </div>
                <h2 className="font-lp-heading text-2xl font-bold sm:text-[28px]">
                  From camera shutter to triage in under 2 minutes
                </h2>
              </div>
              <span className="self-start rounded-full bg-lp-secondary/15 px-2.5 py-1 font-lp-heading text-xs font-semibold text-lp-secondary sm:self-auto">
                Illustrative example
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="relative flex flex-col rounded-xl bg-lp-surface p-4 shadow-inner lg:col-span-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-lp-heading text-[11px] font-semibold uppercase tracking-wider text-lp-text-secondary">
                    Shot 1 of 5 · Front bite
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-lp-secondary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lp-secondary" />
                    Aligned
                  </span>
                </div>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/examples/front-bite.jpg"
                    alt="Example front bite framing"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                  />
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full text-lp-secondary opacity-80"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    viewBox="0 0 200 200"
                  >
                    <path d="M 20 40 L 20 20 L 40 20" strokeDasharray="0" strokeWidth={2} />
                    <path d="M 180 40 L 180 20 L 160 20" strokeDasharray="0" strokeWidth={2} />
                    <path d="M 20 160 L 20 180 L 40 180" strokeDasharray="0" strokeWidth={2} />
                    <path d="M 180 160 L 180 180 L 160 180" strokeDasharray="0" strokeWidth={2} />
                  </svg>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-lp-primary-container font-lp-heading text-xs font-bold text-white">
                      1
                    </div>
                    {[2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="flex h-7 w-7 items-center justify-center rounded bg-lp-surface-container-low font-lp-heading text-xs text-lp-text-muted"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-lp-text-muted">Auto-capture on alignment</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl bg-lp-surface-container p-4 sm:p-5 lg:col-span-7">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-lp-border-subtle pb-3">
                    <span className="flex items-center gap-2 font-lp-heading text-sm font-semibold">
                      <BadgeCheck className="h-4 w-4 text-lp-primary" />
                      Instant Triage Scorecard
                    </span>
                    <span className="font-mono text-xs text-lp-text-muted">6 of 9 shown</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PREVIEW_FINDINGS.map((finding) => {
                      const def = DIAGNOSTIC_DEFS.find((d) => d.key === finding.key)!;
                      const Icon = DETECTION_ICONS[finding.key];
                      return (
                        <div key={finding.key} className="rounded-lg bg-lp-surface-card p-2.5">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-lp-text-primary">
                              <Icon className="h-3.5 w-3.5 text-lp-text-muted" />
                              {def.label}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PREVIEW_TONE_CLASSES[finding.tone]}`}
                            >
                              {finding.tag}
                            </span>
                          </div>
                          <p className="text-xs text-lp-text-muted">{finding.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 rounded-xl bg-lp-surface-card p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lp-status-warning/20">
                      <CalendarCheck className="h-5 w-5 text-lp-status-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-lp-text-primary">Routine check-up recommended</p>
                      <p className="text-xs text-lp-text-muted">One area flagged for review within 30 days.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="font-lp-heading text-xs font-semibold uppercase tracking-widest text-lp-tertiary">
              How it works
            </span>
            <h2 className="mt-1 mb-2 font-lp-heading text-3xl font-bold">Two frictionless steps</h2>
            <p className="text-lp-text-secondary">
              Designed for quick self-capture on your own phone, no assistance needed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.number}
                className="flex flex-col justify-between rounded-2xl bg-lp-surface-card p-6 shadow-lg transition-colors duration-300 hover:bg-lp-surface-container sm:p-8"
              >
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-lp-heading text-3xl font-bold text-lp-text-muted">{step.number}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lp-surface-container-high">
                      <step.icon className={`h-5 w-5 ${step.iconClass}`} />
                    </div>
                  </div>
                  <h3 className="mb-2 font-lp-heading text-xl font-semibold">{step.title}</h3>
                  <p className="text-lp-text-secondary">{step.detail}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-lp-text-muted">
                  <step.metaIcon className="h-4 w-4 text-lp-secondary" />
                  {step.meta}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-widest text-lp-tertiary">
                Vision architecture
              </span>
              <h2 className="mt-1 font-lp-heading text-3xl font-bold">What our screening detects</h2>
              <p className="mt-1 text-lp-text-secondary">
                A closed taxonomy designed for surface screening, avoiding alarmist over-diagnosis.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-lg bg-lp-surface-card px-3 py-1.5 text-sm text-lp-text-muted">
              <ShieldAlert className="h-4 w-4 text-lp-primary" />
              9 core visual categories
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DIAGNOSTIC_DEFS.map((def) => {
              const Icon = DETECTION_ICONS[def.key];
              return (
                <div
                  key={def.key}
                  className="rounded-2xl bg-lp-surface-card p-6 shadow-lg transition-shadow hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lp-surface-container text-lp-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-lp-heading text-base font-semibold">{def.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-lp-text-secondary">{def.prompt}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
          <div className="rounded-2xl bg-lp-surface-card p-6 shadow-xl sm:p-10">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-wider text-lp-primary">
                Clinical transparency
              </span>
              <h2 className="mt-1 mb-2 font-lp-heading text-3xl font-bold">Triage vs. definitive diagnosis</h2>
              <p className="text-lp-text-secondary">
                We believe in responsible oral healthcare. Understanding the boundaries of visual
                screening keeps patients safe.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col justify-between rounded-xl bg-lp-surface-container p-6">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-lp-secondary" />
                    <h3 className="font-lp-heading text-lg font-semibold">What toothpaste.cv provides</h3>
                  </div>
                  <ul className="flex flex-col gap-3 text-sm text-lp-text-secondary">
                    {TOOTHPASTE_PROVIDES.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Circle className="mt-1 h-3 w-3 shrink-0 fill-lp-secondary text-lp-secondary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-3 font-lp-heading text-xs font-semibold text-lp-secondary">
                  Purpose: Early awareness &amp; triage
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-lp-surface-container p-6">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <PlayCircle className="h-6 w-6 text-lp-status-warning" />
                    <h3 className="font-lp-heading text-lg font-semibold">What requires a licensed dentist</h3>
                  </div>
                  <ul className="flex flex-col gap-3 text-sm text-lp-text-secondary">
                    {REQUIRES_DENTIST.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-lp-status-warning" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-3 font-lp-heading text-xs font-semibold text-lp-status-warning">
                  Purpose: Definitive medical diagnosis &amp; treatment
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-4xl px-5 py-16 text-center sm:px-6 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-lp-surface-container to-lp-surface-card p-8 shadow-2xl sm:p-14">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-lp-primary/20 blur-[90px]" />
            <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lp-primary-container text-lp-on-primary-container shadow-lg">
                <Camera className="h-7 w-7" />
              </div>
              <h2 className="mb-3 font-lp-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Check your teeth in under 2 minutes.
              </h2>
              <p className="mb-8 text-lg text-lp-text-secondary">
                No waiting rooms, no credit card, and nothing to install. Runs instantly in your
                browser on iOS, Android, or desktop.
              </p>
              <Link
                href="/capture"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-primary-container px-10 py-4 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-2xl transition-all duration-300 hover:bg-lp-primary hover:shadow-[0_0_32px_rgba(59,130,246,0.5)] sm:w-auto"
              >
                <PlayCircle className="h-5 w-5" />
                Launch Camera Screening
              </Link>
              <div className="mt-6 flex items-center gap-3 text-sm text-lp-text-muted">
                <span>Works with Safari, Chrome &amp; Firefox</span>
                <span>·</span>
                <span>No account required</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-lp-border-subtle bg-lp-surface">
        <div className="mx-auto max-w-6xl px-5 py-8 text-center text-xs text-lp-text-muted sm:px-6">
          toothpaste.cv gives a preliminary visual screening only and is not a medical diagnosis.
          Always consult a licensed dentist for advice about your oral health.
        </div>
      </footer>
    </div>
  );
}
