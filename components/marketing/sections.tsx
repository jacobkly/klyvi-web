import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ReasonChips } from "@/components/klyvi/reason-chips";
import { LandingHeader } from "@/components/marketing/landing-header";
import { Reveal } from "@/components/marketing/reveal";
import { buttonVariants } from "@/components/ui/button";
import { CLOSING_CLAIM, STAT_CLAIMS } from "@/lib/marketing-claims";

/**
 * The static landing sections: stats band, features row, closing CTA.
 * Every number renders from lib/marketing-claims.ts, which is the one
 * quarantine for invented figures.
 */

/**
 * Small decorative data-viz glyphs for the stat cards, one per claim:
 * a timer dial, an accumulation of bars, a donut. All aria-hidden (the
 * numeral and line carry the meaning), all chart tokens.
 */
function TimerGlyph() {
  // Quarter sweep on a dial: the 90 seconds, drawn as time on a clock.
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-12">
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="4"
      />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--chart-2)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${c * 0.25} ${c}`}
        transform="rotate(-90 24 24)"
      />
      <circle cx="24" cy="24" r="2.5" fill="var(--chart-1)" />
      <line
        x1="24"
        y1="24"
        x2="38"
        y2="10"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SignalsGlyph() {
  // Signals piling up: five ascending bars, dark to bright.
  const bars = [10, 16, 22, 30, 38];
  const colors = [
    "var(--chart-5)",
    "var(--chart-4)",
    "var(--chart-3)",
    "var(--chart-2)",
    "var(--chart-1)",
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-12">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={4 + i * 9}
          y={44 - h}
          width="6"
          height={h}
          rx="2"
          fill={colors[i]}
        />
      ))}
    </svg>
  );
}

function DonutGlyph({ pct }: { pct: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-12">
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="6"
      />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--chart-2)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

const STAT_GLYPHS = [
  <TimerGlyph key="timer" />,
  <SignalsGlyph key="signals" />,
  <DonutGlyph key="donut" pct={87} />,
];

export function StatsBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:pt-32">
      <Reveal>
        <LandingHeader
          align="split"
          eyebrow="Why it works"
          title="Less deciding. More watching."
          lead="One trustworthy pick you can act on in minutes, built from what you rate rather than what is trending."
          className="mb-10"
        />
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-3">
        {STAT_CLAIMS.map((s, i) => (
          <Reveal key={s.category} delay={i * 0.08}>
            <div className="flex min-h-48 flex-col rounded-lg bg-card p-6 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-muted-foreground">{s.category}</p>
                {STAT_GLYPHS[i]}
              </div>
              <div className="mt-auto">
                <p
                  data-numeric
                  className="font-mono text-4xl tracking-tight text-foreground sm:text-5xl"
                >
                  {s.value}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.line}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** A live season-tracking vignette: real components, sample rows. */
function SeasonsVignette() {
  const rows = [
    { label: "Season 1", score: 92 },
    { label: "Season 2", score: 88 },
    { label: "Season 4", score: 61 },
  ];
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-sm text-muted-foreground">
            {r.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-3"
              style={{ width: `${r.score}%` }}
              aria-hidden="true"
            />
          </div>
          <span
            data-numeric
            className="w-8 shrink-0 text-right font-mono text-sm text-foreground"
          >
            {r.score}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A pager vignette: the one-pick rhythm without the machinery. */
function PagerVignette() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-4 py-2"
    >
      <span className="flex size-9 items-center justify-center rounded-full ring-1 ring-foreground/15">
        <ChevronLeft className="size-4 text-muted-foreground" strokeWidth={2} />
      </span>
      <span data-numeric className="font-mono text-base text-foreground">
        3 / 5
      </span>
      <span className="flex size-9 items-center justify-center rounded-full ring-1 ring-foreground/15">
        <ChevronRight
          className="size-4 text-muted-foreground"
          strokeWidth={2}
        />
      </span>
    </div>
  );
}

const FEATURES = [
  {
    eyebrow: "01",
    title: "It tells you why",
    body: "Every pick comes with its reasons: the keywords, people, and films behind it. No other app explains itself, and it is the whole point.",
    vignette: (
      <ReasonChips
        reasons={[
          { kind: "keyword", id: 1, name: "slow-burn" },
          { kind: "keyword", id: 2, name: "unreliable narrator" },
          { kind: "keyword", id: 3, name: "because you liked Parasite" },
        ]}
      />
    ),
  },
  {
    eyebrow: "02",
    title: "Track TV properly",
    body: "Season by season, the way you actually watch it. A great first season and a weak fourth stay two different numbers instead of one blurred average.",
    vignette: <SeasonsVignette />,
  },
  {
    eyebrow: "03",
    title: "One pick, not a feed",
    body: "Ask for three, five, or seven. Step through them and press play on one. No endless rows engineered to keep you scrolling instead of watching.",
    vignette: <PagerVignette />,
  },
];

export function FeaturesRow() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <Reveal>
        <LandingHeader
          align="split"
          eyebrow="How it works"
          title="Genre is a terrible way to pick a film"
          lead="Klyvi works from what actually predicts your taste: keywords, cast, and the films you rated highly."
          className="mb-10"
        />
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <div className="flex h-full flex-col rounded-lg bg-card p-6 ring-1 ring-foreground/10">
              <p data-numeric className="font-mono text-sm text-violet-text">
                {f.eyebrow}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
              <div className="mt-6 rounded-lg bg-background/50 p-4 ring-1 ring-foreground/10">
                {f.vignette}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const CLOSING_REASSURANCE = [
  "Free while Klyvi grows",
  "No card",
  "No ads",
  "Your ratings stay yours",
];

export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-12 pb-28">
      <Reveal>
      <div className="relative overflow-hidden rounded-lg bg-card px-6 py-20 text-center ring-1 ring-foreground/10 sm:py-24">
        {/* Violet only where the app speaks: a faint bloom behind the final
            ask, not a background wash. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 h-64 [background:radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
        />
        <p className="relative text-sm font-medium tracking-[0.14em] text-violet-text uppercase">
          Tonight
        </p>
        <h2 className="relative mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {CLOSING_CLAIM.heading}
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-base text-balance text-muted-foreground">
          {CLOSING_CLAIM.line}
        </p>
        <div className="relative mt-8 flex items-center justify-center gap-4">
          <Link href="/signup" className={buttonVariants({ size: "touch" })}>
            Get started
          </Link>
          <Link
            href="/signin"
            className="tap-target inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            I have an account
          </Link>
        </div>
        <ul className="relative mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
          {CLOSING_REASSURANCE.map((item, i) => (
            <li key={item} className="flex items-center gap-2">
              {i > 0 ? (
                <span aria-hidden="true" className="text-muted-foreground/40">
                  ·
                </span>
              ) : null}
              {item}
            </li>
          ))}
        </ul>
      </div>
      </Reveal>
    </section>
  );
}
