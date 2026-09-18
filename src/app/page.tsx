"use client";

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

type PreviewTone = "success" | "warning" | "danger";

const PREVIEW_TONE_CLASSES: Record<PreviewTone, string> = {
  success: "bg-lp-status-success/15 text-lp-status-success",
  warning: "bg-lp-status-warning/15 text-lp-status-warning",
  danger: "bg-lp-status-danger/15 text-lp-status-danger",
};

const PREVIEW_FINDINGS: { key: FindingKey; tag: string; tone: PreviewTone; detail: string }[] = [
  { key: "crowding", tag: "Mild", tone: "warning", detail: "Slight lower front rotation" },
  { key: "wear", tag: "Minimal", tone: "success", detail: "Normal incisal edges" },
  { key: "discoloration", tag: "Surface", tone: "warning", detail: "Light staining, upper front" },
  { key: "gumHealth", tag: "Healthy", tone: "success", detail: "Firm margins, no swelling" },
  { key: "chipsOrFractures", tag: "Clear", tone: "success", detail: "Enamel edges intact" },
  { key: "possibleDecay", tag: "Flagged", tone: "danger", detail: "Dark pit on upper right molar" },
];

const CUSTOMER_JOURNEY = [
  {
    number: "01",
    icon: Camera,
    iconClass: "text-lp-secondary",
    title: "Start with the concern",
    detail: "The page makes the problem obvious: users want to know whether visible changes need attention.",
    meta: "Attention",
    metaIcon: Zap,
  },
  {
    number: "02",
    icon: ClipboardCheck,
    iconClass: "text-lp-tertiary",
    title: "Take five guided photos",
    detail: "Front bite, upper arch, lower arch, and side views are framed as one clear capture flow.",
    meta: "Understanding",
    metaIcon: Sparkles,
  },
  {
    number: "03",
    icon: FileText,
    iconClass: "text-lp-primary",
    title: "Read a plain report",
    detail: "Users see severity, photo evidence, dental map context, and simple next-step language.",
    meta: "Trust",
    metaIcon: BadgeCheck,
  },
  {
    number: "04",
    icon: History,
    iconClass: "text-lp-secondary",
    title: "Track changes over time",
    detail: "Saved reports become a timeline so repeat checks feel useful after the first visit.",
    meta: "After the report",
    metaIcon: CalendarCheck,
  },
  {
    number: "05",
    icon: Stethoscope,
    iconClass: "text-lp-tertiary",
    title: "Escalate when needed",
    detail: "Higher concern reports can move toward dentist review instead of leaving the user guessing.",
    meta: "Conversion",
    metaIcon: ArrowRight,
  },
];

const TRUST_SIGNALS = [
  { icon: CheckCircle2, label: "No account required", tone: "text-lp-secondary" },
  { icon: Lock, label: "Zero photos stored permanently", tone: "text-lp-secondary" },
  { icon: Info, label: "Triage, not medical diagnosis", tone: "text-lp-tertiary" },
];

const CONSIDERATION_POINTS = [
  {
    question: "Hard to take the upper arch?",
    answer: "The capture flow gives angle-specific coaching while still keeping the required five-photo format.",
  },
  {
    question: "No teeth visible in the upload?",
    answer: "Image validation asks the user to retake or re-upload a clearer mouth photo before analysis.",
  },
  {
    question: "Missing teeth or gum-only concerns?",
    answer: "The report can explain visibility limits and guide users toward dentist review for gum symptoms.",
  },
  {
    question: "Is this a diagnosis?",
    answer: "No. It is positioned as early visual triage that helps users decide when to consult a dentist.",
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

function ReportWindowPreview() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-lp-border-subtle bg-white shadow-[0_30px_90px_rgba(13,50,27,0.18)]">
      <div className="flex items-center gap-2 border-b border-lp-border-subtle bg-[#f8fbf3] px-4 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-2 flex-1 rounded-full bg-white px-3 py-1 text-center font-mono text-[10px] text-lp-text-muted">
          toothpaste.cv/report
        </div>
      </div>

      <div className="min-h-[420px] bg-[#fbfdf8] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-lp-heading text-[10px] font-bold uppercase tracking-[0.24em] text-lp-primary">
              Visual oral health report
            </p>
            <h2 className="mt-2 font-lp-heading text-3xl font-bold leading-tight text-lp-text-primary">
              Worth monitoring
            </h2>
          </div>
          <span className="rounded-full bg-[#1f7a3f]/10 px-3 py-1.5 text-xs font-semibold text-[#1f7a3f]">
            AI draft
          </span>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["6", "flagged"],
              ["3", "views"],
              ["PDF", "ready"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-lp-surface-container-low px-3 py-3">
                <p className="font-lp-heading text-2xl font-bold text-lp-text-primary">{value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-lp-text-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {["front-bite", "left-buccal", "right-buccal"].map((name) => (
              <div key={name} className="h-20 overflow-hidden rounded-2xl bg-lp-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/tooth-sides/${name}.png`} alt="" className="h-full w-full object-cover opacity-85" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {[
            ["Possible decay", "Upper right molar", "#d84d4d"],
            ["Gum health", "Front gumline", "#d79a16"],
            ["Crowding", "Lower front", "#1f7a3f"],
          ].map(([title, detail, color]) => (
            <div key={title} className="flex items-center justify-between rounded-2xl border border-lp-border-subtle bg-white px-3 py-3 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-lp-text-primary">{title}</p>
                <p className="mt-0.5 text-xs text-lp-text-muted">{detail}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#0d5a2b] px-4 py-3 text-white">
          <span className="text-sm font-semibold">Dentist-ready summary</span>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
            Download PDF
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="theme-minimal flex w-full min-w-0 flex-1 flex-col bg-lp-surface font-lp-body text-lp-text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-lp-border-subtle bg-lp-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="font-lp-heading text-lg font-bold tracking-tight text-lp-text-primary transition-opacity hover:opacity-80"
            >
              toothpaste<span className="text-lp-primary-container">.cv</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TimelineNavButton className="border-lp-border-subtle bg-lp-surface-card text-lp-text-secondary shadow-[0_10px_30px_rgba(13,50,27,0.08)] hover:text-lp-text-primary" />
            <AuthButton />
            <Link
              href="/capture"
              className="inline-flex items-center justify-center rounded-full bg-lp-primary-container px-3 py-2 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-[0_12px_34px_rgba(202,255,99,0.2)] transition-colors hover:bg-lp-primary sm:px-4"
            >
              Start Screening
            </Link>
          </div>
        </div>
      </header>

      <main className="flex w-full min-w-0 flex-1 flex-col">
        <section className="relative isolate w-full overflow-hidden bg-[#f6fbef] px-5 py-8 sm:px-6 sm:py-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/upper-arch.jpg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[620px] w-full object-cover opacity-[0.08] saturate-50"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[660px] bg-[radial-gradient(circle_at_78%_10%,rgba(202,255,99,0.32),transparent_34%),linear-gradient(180deg,rgba(246,251,239,0.68),rgba(246,251,239,0.97)_55%,#ffffff)]" />

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            <BentoTile className="flex min-h-[460px] flex-col justify-between p-6 sm:p-7 lg:col-span-5 lg:row-span-2 lg:min-h-[520px]">
              <div className="relative z-10">
                <h1 className="max-w-3xl font-lp-heading text-4xl font-extrabold tracking-tight text-lp-text-primary lg:text-6xl">
                  Know when your smile needs a closer look.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-lp-text-secondary lg:text-lg lg:leading-8">
                  Take mouth photos. Get a visual report in seconds.
                </p>
              </div>

              <div className="relative z-10 mt-10">
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Link
                    href="/capture"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-primary-container px-8 py-4 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-[0_14px_34px_rgba(202,255,99,0.22)] transition-all duration-300 hover:bg-lp-primary hover:shadow-[0_16px_42px_rgba(202,255,99,0.28)] sm:w-auto"
                  >
                    Start oral check
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#preview"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-lp-border-subtle bg-lp-surface-container-high px-6 py-4 font-lp-heading text-sm font-semibold text-lp-text-primary shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-colors hover:bg-lp-surface-container sm:w-auto"
                  >
                    <Eye className="h-4 w-4 text-lp-tertiary" />
                    View sample report
                  </a>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  {TRUST_SIGNALS.map((signal) => (
                    <div
                      key={signal.label}
                      className="flex items-center gap-2 rounded-xl bg-lp-surface-container-low px-3 py-2 text-xs text-lp-text-secondary"
                    >
                      <signal.icon className={`h-4 w-4 shrink-0 ${signal.tone}`} />
                      <span>{signal.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </BentoTile>

            <BentoTile className="min-h-[460px] p-4 lg:col-span-7 lg:row-span-2 lg:min-h-[520px]">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-lp-heading text-[11px] font-semibold uppercase tracking-wider text-lp-text-secondary">
                  Report preview
                </span>
              </div>

              <ReportWindowPreview />

            </BentoTile>

            <BentoTile className="flex min-h-44 flex-col justify-between bg-lp-surface-container p-5 lg:col-span-3">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lp-secondary/15 text-lp-secondary">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-lp-secondary/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-lp-secondary">
                  Ready
                </span>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-lp-text-muted">
                  Screening snapshot
                </p>
                <p className="mt-2 font-lp-heading text-4xl font-bold text-lp-text-primary">05</p>
                <p className="mt-1 text-sm text-lp-text-secondary">guided photos</p>
              </div>
            </BentoTile>

            <BentoTile className="flex min-h-44 flex-col justify-between bg-lp-surface-container-low p-5 lg:col-span-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lp-primary-container/20 text-lp-primary">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-lp-text-muted">
                  Screening areas
                </p>
                <p className="mt-2 font-lp-heading text-4xl font-bold text-lp-text-primary">09</p>
                <p className="mt-1 text-sm text-lp-text-secondary">screening categories</p>
              </div>
            </BentoTile>

            <BentoTile className="flex min-h-44 flex-col justify-between p-5 lg:col-span-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-lp-text-muted">
                    Clinical boundary
                  </p>
                  <p className="mt-2 font-lp-heading text-xl font-semibold text-lp-text-primary">
                    Useful triage, not a definitive diagnosis.
                  </p>
                </div>
                <ShieldAlert className="h-5 w-5 shrink-0 text-lp-primary" />
              </div>
              <p className="mt-5 text-sm leading-6 text-lp-text-secondary">
                Visual screening highlights surface-level concerns that may deserve a closer look
                from a licensed dentist.
              </p>
            </BentoTile>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-widest text-lp-tertiary">
                Customer journey
              </span>
              <h2 className="mt-1 max-w-2xl font-lp-heading text-3xl font-bold">
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

        <section id="preview" className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-widest text-lp-tertiary">
                Sample report
              </span>
              <h2 className="mt-1 font-lp-heading text-3xl font-bold">
                See the report format before you start.
              </h2>
            </div>
            <span className="self-start rounded-full bg-lp-secondary/15 px-2.5 py-1 font-lp-heading text-xs font-semibold text-lp-secondary sm:self-auto">
              Illustrative example
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <BentoTile className="p-4 sm:p-5 lg:col-span-7 lg:row-span-2">
              <div className="mb-4 flex items-center justify-between border-b border-lp-border-subtle pb-3">
                <span className="flex items-center gap-2 font-lp-heading text-sm font-semibold">
                  <BadgeCheck className="h-4 w-4 text-lp-primary" />
                  Visual report snapshot
                </span>
                <span className="font-mono text-xs text-lp-text-muted">6 of 9 shown</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PREVIEW_FINDINGS.map((finding) => {
                  const def = DIAGNOSTIC_DEFS.find((d) => d.key === finding.key)!;
                  const Icon = DETECTION_ICONS[finding.key];
                  return (
                    <div key={finding.key} className="rounded-xl bg-lp-surface-container-low p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-lp-text-primary">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-lp-text-muted" />
                          <span className="truncate">{def.label}</span>
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
            </BentoTile>

            <BentoTile className="flex min-h-48 flex-col justify-between bg-lp-surface-container p-5 lg:col-span-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lp-status-warning/20">
                  <CalendarCheck className="h-5 w-5 text-lp-status-warning" />
                </div>
                <div>
                  <p className="font-lp-heading text-lg font-semibold text-lp-text-primary">
                    Routine check-up recommended
                  </p>
                  <p className="mt-1 text-sm leading-6 text-lp-text-secondary">
                    One area is flagged for professional review within 30 days.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["1 notable", "2 mild", "6 clear"].map((item) => (
                  <span
                    key={item}
                    className="rounded-xl bg-lp-surface-card px-3 py-2 text-center text-xs font-medium text-lp-text-secondary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </BentoTile>

            <BentoTile className="bg-lp-surface-container-low p-5 lg:col-span-5">
              <p className="font-mono text-xs uppercase tracking-widest text-lp-text-muted">
                What you get
              </p>
              <p className="mt-2 font-lp-heading text-xl font-semibold text-lp-text-primary">
                Map, photo evidence, severity labels, and a PDF-ready summary.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Dental map", "Key findings", "Photo review", "PDF export"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-lp-surface-card px-3 py-1.5 text-xs font-medium text-lp-text-secondary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </BentoTile>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <BentoTile className="p-6 sm:p-7 lg:col-span-5">
              <span className="font-lp-heading text-xs font-semibold uppercase tracking-widest text-lp-tertiary">
                Consideration
              </span>
              <h2 className="mt-2 font-lp-heading text-3xl font-bold">
                The common doubts are answered before the user gets stuck.
              </h2>
              <p className="mt-4 text-sm leading-6 text-lp-text-secondary">
                The experience should make edge cases feel expected: difficult camera angles,
                invalid images, missing teeth, and the boundary between screening and diagnosis.
              </p>
            </BentoTile>

            <BentoTile className="p-4 sm:p-5 lg:col-span-7">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CONSIDERATION_POINTS.map((item) => (
                  <div key={item.question} className="rounded-2xl bg-lp-surface-container-low p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 shrink-0 text-lp-primary" />
                      <h3 className="font-lp-heading text-sm font-semibold text-lp-text-primary">
                        {item.question}
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-lp-text-secondary">{item.answer}</p>
                  </div>
                ))}
              </div>
            </BentoTile>
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

        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:pb-16">
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
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-primary-container px-8 py-4 font-lp-heading text-sm font-semibold text-lp-on-primary-container shadow-[0_12px_28px_rgba(35,95,100,0.18)] transition-all duration-300 hover:bg-lp-primary hover:shadow-[0_12px_28px_rgba(35,95,100,0.22)] sm:w-auto"
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
