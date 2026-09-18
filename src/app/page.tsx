"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  FileText,
  HelpCircle,
  History,
  Info,
  Layers,
  Leaf,
  Lock,
  PlayCircle,
  Ruler,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { DIAGNOSTIC_DEFS, type FindingKey } from "@/lib/analysis-schema";
import { AuthButton } from "@/components/auth/AuthButton";
import { TimelineNavButton } from "@/components/auth/TimelineNavButton";

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

const CUSTOMER_JOURNEY = [
  {
    number: "01",
    icon: Camera,
    iconClass: "text-lp-secondary",
    title: "Start with the concern",
    detail: "You open with a clear question: is this visible change worth a closer look, or can it wait?",
    meta: "Attention",
    metaIcon: Zap,
  },
  {
    number: "02",
    icon: ClipboardCheck,
    iconClass: "text-lp-tertiary",
    title: "Take five guided photos",
    detail: "Front bite, upper arch, lower arch, and both side views follow one guided capture flow.",
    meta: "Understanding",
    metaIcon: Sparkles,
  },
  {
    number: "03",
    icon: FileText,
    iconClass: "text-lp-primary",
    title: "Read a plain report",
    detail: "Severity, photo evidence, dental map context, and plain next-step language in one place.",
    meta: "Trust",
    metaIcon: BadgeCheck,
  },
  {
    number: "04",
    icon: History,
    iconClass: "text-lp-secondary",
    title: "Track changes over time",
    detail: "Saved reports become a timeline so later checks show what improved, stayed, or worsened.",
    meta: "After the report",
    metaIcon: CalendarCheck,
  },
  {
    number: "05",
    icon: Stethoscope,
    iconClass: "text-lp-tertiary",
    title: "Bring it to your dentist",
    detail:
      "When something is flagged, the report packages map context, evidence, and a dentist-ready summary for the visit.",
    meta: "Clinic handoff",
    metaIcon: ArrowRight,
  },
];

const TRUST_SIGNALS = [
  { icon: CheckCircle2, label: "No account required", tone: "text-lp-secondary" },
  { icon: Lock, label: "Zero photos stored permanently", tone: "text-lp-secondary" },
  { icon: Info, label: "Triage, not medical diagnosis", tone: "text-lp-tertiary" },
];

const FAQ_ITEMS = [
  {
    question: "Is this a dental diagnosis?",
    answer:
      "No. toothpaste.cv is a visual screening tool only. It flags surface-level concerns and helps you decide when to see a licensed dentist.",
  },
  {
    question: "What photos do I need?",
    answer:
      "Five guided views with framing cues. If a shot is unclear or teeth are not visible, the flow asks you to retake before analysis.",
  },
  {
    question: "Where do my photos go?",
    answer:
      "Photos stay in this browser session for the report. We do not keep permanent photo storage for the free screening flow.",
  },
  {
    question: "How does the AI review work?",
    answer:
      "Your photos are sent to a vision model with a fixed oral-health rubric. Output is structured findings with severity, region, and plain-English notes.",
  },
  {
    question: "Can I share this with a dentist?",
    answer:
      "Yes. The report is designed as a pre-visit summary with photo evidence and severity labels you can save or export.",
  },
  {
    question: "What can it not see?",
    answer:
      "Anything under the surface: cavities between teeth, pocket depth, root issues, and treatment planning all still need a clinical exam.",
  },
];

const TECH_POINTS = [
  {
    title: "Structured vision output",
    detail: "Findings are forced into a typed schema: severity, region, zone, and location label.",
  },
  {
    title: "Conservative severity rubric",
    detail: "Mild / moderate / notable anchors reduce random swings on borderline photos.",
  },
  {
    title: "Local timeline",
    detail: "Saved screenings stay on-device so you can compare flagged trends across visits.",
  },
];

const NEXT_ACTIONS = [
  {
    title: "Low concern",
    detail: "Save the report, compare future checks, and keep routine hygiene habits visible.",
    icon: CheckCircle2,
    tone: "text-lp-secondary",
  },
  {
    title: "Medium concern",
    detail: "Monitor the area, retake photos later, and prepare better questions for a dentist.",
    icon: History,
    tone: "text-lp-tertiary",
  },
  {
    title: "High concern",
    detail: "Move toward dentist review or referral with the user's explicit consent.",
    icon: Stethoscope,
    tone: "text-lp-status-warning",
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

function BentoTile({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-lp-border-subtle bg-lp-surface-card shadow-[0_20px_60px_rgba(13,50,27,0.1)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="theme-minimal flex w-full min-w-0 flex-1 flex-col bg-lp-surface font-lp-body text-lp-text-primary">
      <header
        className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-colors duration-300 ${
          isScrolled
            ? "border-lp-border-subtle bg-lp-surface/95"
            : "border-white/10 bg-[#0b2f1a]/95"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className={`font-lp-heading text-lg font-bold tracking-tight transition-colors duration-300 hover:opacity-80 ${
                isScrolled ? "text-lp-text-primary" : "text-white"
              }`}
            >
              toothpaste
              <span className={isScrolled ? "text-[#7ea51f]" : "text-white"}>.cv</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TimelineNavButton
              className={
                isScrolled
                  ? "border-lp-border-subtle bg-lp-surface-card text-lp-text-secondary shadow-[0_10px_30px_rgba(13,50,27,0.08)] hover:text-lp-text-primary"
                  : "border-white/15 bg-white/10 text-white/80 shadow-none hover:text-white"
              }
            />
            <AuthButton
              className={
                isScrolled
                  ? "border-lp-border-subtle bg-lp-surface-card text-lp-text-secondary shadow-[0_10px_30px_rgba(13,50,27,0.08)] hover:text-lp-text-primary"
                  : "border-white/15 bg-white/10 text-white/80 shadow-none hover:text-white"
              }
            />
            <Link
              href="/capture"
              className="inline-flex items-center justify-center rounded-full bg-lp-primary-container px-3 py-2 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-[0_8px_22px_rgba(202,255,99,0.26),0_2px_10px_rgba(13,50,27,0.08)] transition-all duration-300 hover:brightness-105 hover:shadow-[0_0_0_4px_rgba(202,255,99,0.24),0_0_34px_rgba(202,255,99,0.72),0_14px_32px_rgba(13,50,27,0.12)] sm:px-4"
            >
              Start Screening
            </Link>
          </div>
        </div>
      </header>

      <main className="flex w-full min-w-0 flex-1 flex-col">
        <section className="relative isolate w-full overflow-hidden bg-[#0b2f1a] px-5 py-16 text-white sm:px-6 sm:py-24">
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_12%,rgba(202,255,99,0.32),transparent_30%),radial-gradient(circle_at_18%_20%,rgba(31,155,88,0.28),transparent_26%),linear-gradient(135deg,#071d11_0%,#0b2f1a_48%,#123f21_100%)]" />
          <div className="pointer-events-none absolute right-[8%] top-16 -z-10 h-64 w-64 rounded-full bg-lp-primary-container/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-160px] left-1/2 -z-10 h-80 w-[720px] -translate-x-1/2 rounded-full bg-lp-primary-container/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />

          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <h1 className="max-w-4xl font-lp-display text-6xl font-semibold leading-[0.96] tracking-[-0.03em] text-[#f6fff0] sm:text-7xl lg:text-8xl">
              Know when your smile needs a closer look.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#d7e8d4] sm:text-lg">
              Guided oral photos turn into a clear visual screening report, so you know what to watch and when to see a dentist.
            </p>

            <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/capture"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-primary-container px-8 py-4 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-[0_12px_30px_rgba(202,255,99,0.28),0_3px_14px_rgba(13,50,27,0.08)] transition-all duration-300 hover:brightness-105 hover:shadow-[0_0_0_5px_rgba(202,255,99,0.24),0_0_42px_rgba(202,255,99,0.76),0_18px_42px_rgba(13,50,27,0.12)] sm:w-auto"
              >
                Start oral check
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#faq"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-4 font-lp-heading text-sm font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,0.16)] transition-all duration-300 hover:bg-white/15 hover:shadow-[0_0_24px_rgba(202,255,99,0.18)] sm:w-auto"
              >
                <HelpCircle className="h-4 w-4 text-lp-primary-container" />
                FAQ & how it works
              </a>
            </div>

            <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
              {TRUST_SIGNALS.map((signal) => (
                <div
                  key={signal.label}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-[#d7e8d4] shadow-[0_14px_34px_rgba(0,0,0,0.16)] backdrop-blur"
                >
                  <signal.icon className={`h-4 w-4 shrink-0 ${signal.tone}`} />
                  <span>{signal.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
              <BentoTile className="border-white/10 bg-white/10 p-5 text-left shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur">
                <Activity className="h-5 w-5 text-lp-primary-container" />
                <p className="mt-5 font-lp-heading text-3xl font-bold text-white">05</p>
                <p className="mt-1 text-sm text-[#d7e8d4]">guided photos</p>
              </BentoTile>

              <BentoTile className="border-white/10 bg-white/10 p-5 text-left shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur">
                <BadgeCheck className="h-5 w-5 text-lp-primary-container" />
                <p className="mt-5 font-lp-heading text-3xl font-bold text-white">09</p>
                <p className="mt-1 text-sm text-[#d7e8d4]">screening categories</p>
              </BentoTile>

              <BentoTile className="border-white/10 bg-white/10 p-5 text-left shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur">
                <ShieldAlert className="h-5 w-5 text-lp-primary-container" />
                <p className="mt-5 font-lp-heading text-lg font-semibold text-white">
                  Triage only
                </p>
                <p className="mt-1 text-sm text-[#d7e8d4]">not a diagnosis</p>
              </BentoTile>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="max-w-2xl font-lp-heading text-3xl font-bold">
                From first concern to a confident next step.
              </h2>
            </div>
            <Link
              href="/capture"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-lp-border-subtle bg-lp-surface-card px-4 py-2 font-lp-heading text-sm font-semibold text-lp-text-primary shadow-[0_10px_30px_rgba(13,50,27,0.08)] transition-colors hover:bg-lp-surface-container sm:self-auto"
            >
              Start the flow
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {CUSTOMER_JOURNEY.map((step) => (
              <BentoTile
                key={step.number}
                className="flex min-h-64 flex-col justify-between p-5 transition-colors duration-300 hover:bg-lp-surface-container"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="font-lp-heading text-3xl font-bold text-lp-text-muted">
                      {step.number}
                    </span>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lp-surface-container-high">
                      <step.icon className={`h-5 w-5 ${step.iconClass}`} />
                    </div>
                  </div>
                  <h3 className="font-lp-heading text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-lp-text-secondary">{step.detail}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-lp-text-muted">
                  <step.metaIcon className="h-4 w-4 text-lp-secondary" />
                  {step.meta}
                </div>
              </BentoTile>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-widest text-lp-tertiary">
                Screening areas
              </span>
              <h2 className="mt-1 font-lp-heading text-3xl font-bold">What the check looks for</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-lp-surface-card px-3 py-1.5 text-sm text-lp-text-muted">
              <ShieldAlert className="h-4 w-4 text-lp-primary" />
              9 guided checks
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DIAGNOSTIC_DEFS.map((def) => {
              const Icon = DETECTION_ICONS[def.key];
              return (
                <BentoTile
                  key={def.key}
                  className="min-h-44 p-5 transition-colors hover:bg-lp-surface-container"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-lp-surface-container text-lp-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-lp-heading text-base font-semibold">{def.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-lp-text-secondary">{def.prompt}</p>
                </BentoTile>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <BentoTile className="p-6 sm:p-8 lg:col-span-5">
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-wider text-lp-primary">
                Conversion path
              </span>
              <h2 className="mt-2 font-lp-heading text-3xl font-bold">
                Every report ends with one clear next step.
              </h2>
              <p className="mt-4 text-sm leading-6 text-lp-text-secondary">
                Patients should never leave with only a score. The report turns screening output
                into a practical action based on concern level.
              </p>
              <Link
                href="/capture"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-primary-container px-8 py-4 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-[0_12px_30px_rgba(202,255,99,0.28),0_3px_14px_rgba(13,50,27,0.08)] transition-all duration-300 hover:brightness-105 hover:shadow-[0_0_0_5px_rgba(202,255,99,0.24),0_0_42px_rgba(202,255,99,0.76),0_18px_42px_rgba(13,50,27,0.12)] sm:w-auto"
              >
                <PlayCircle className="h-5 w-5" />
                Start oral check
              </Link>
            </BentoTile>

            <BentoTile className="p-6 lg:col-span-7">
              <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {NEXT_ACTIONS.map((action) => (
                  <div key={action.title} className="rounded-2xl bg-lp-surface-container-low p-4">
                    <action.icon className={`mb-3 h-5 w-5 ${action.tone}`} />
                    <h3 className="font-lp-heading text-sm font-semibold text-lp-text-primary">
                      {action.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-lp-text-secondary">{action.detail}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-lp-secondary" />
                    <h3 className="font-lp-heading text-lg font-semibold">
                      What toothpaste.cv provides
                    </h3>
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

                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-lp-status-warning" />
                    <h3 className="font-lp-heading text-lg font-semibold">
                      What requires a dentist
                    </h3>
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
              </div>
            </BentoTile>
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:pb-16">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-widest text-lp-tertiary">
                FAQ & technical
              </span>
              <h2 className="mt-1 font-lp-heading text-3xl font-bold">
                How the screening works — and what it is not.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <BentoTile className="p-5 sm:p-6 lg:col-span-7">
              <div className="mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-lp-primary" />
                <h3 className="font-lp-heading text-sm font-semibold uppercase tracking-wider text-lp-text-muted">
                  Common questions
                </h3>
              </div>
              <div className="divide-y divide-lp-border-subtle">
                {FAQ_ITEMS.map((item) => (
                  <details key={item.question} className="group py-3.5 first:pt-0 last:pb-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-lp-heading text-sm font-semibold text-lp-text-primary marker:content-none [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span className="shrink-0 text-lp-text-muted transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 pr-8 text-sm leading-6 text-lp-text-secondary">{item.answer}</p>
                  </details>
                ))}
              </div>
            </BentoTile>

            <BentoTile className="flex flex-col gap-4 bg-lp-surface-container p-5 sm:p-6 lg:col-span-5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-lp-secondary" />
                <h3 className="font-lp-heading text-sm font-semibold uppercase tracking-wider text-lp-text-muted">
                  Under the hood
                </h3>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {TECH_POINTS.map((point) => (
                  <div key={point.title} className="rounded-2xl bg-lp-surface-card p-4">
                    <h4 className="font-lp-heading text-sm font-semibold text-lp-text-primary">
                      {point.title}
                    </h4>
                    <p className="mt-1.5 text-sm leading-6 text-lp-text-secondary">{point.detail}</p>
                  </div>
                ))}
              </div>
            </BentoTile>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-lp-border-subtle bg-lp-surface">
        <div className="mx-auto max-w-6xl px-5 py-8 text-center text-xs text-lp-text-muted sm:px-6">
          <p>
            toothpaste.cv gives a preliminary visual screening only and is not a medical diagnosis.
            Always consult a licensed dentist for advice about your oral health.
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/terms" className="underline-offset-2 hover:text-lp-text-secondary hover:underline">
              Terms of Use
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="underline-offset-2 hover:text-lp-text-secondary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
