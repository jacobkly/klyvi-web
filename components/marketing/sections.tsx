import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ReasonChips } from "@/components/klyvi/reason-chips";
import { buttonVariants } from "@/components/ui/button";
import { CLOSING_CLAIM, STAT_CLAIMS } from "@/lib/marketing-claims";

/**
 * The static landing sections: stats band, features row, closing CTA.
 * Every number renders from lib/marketing-claims.ts, which is the one
 * quarantine for invented figures.
 */

export function StatsBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:pt-32">
      <div className="grid gap-3 sm:grid-cols-3">
        {STAT_CLAIMS.map((s) => (
          <div
            key={s.category}
            className="flex min-h-44 flex-col justify-between rounded-lg bg-card p-6 ring-1 ring-foreground/10"
          >
            <p className="text-sm text-muted-foreground">{s.category}</p>
            <div>
              <p
                data-numeric
                className="font-mono text-4xl tracking-tight text-foreground sm:text-5xl"
              >
                {s.value}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.line}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** A tiny live season-tracking vignette: real components, sample rows. */
function SeasonsVignette() {
  const rows = [
    { label: "Season 1", score: 92 },
    { label: "Season 2", score: 88 },
    { label: "Season 4", score: 61 },
  ];
  return (
    <div className="rounded-lg bg-background/60 p-4 ring-1 ring-foreground/10">
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">
              {r.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-3"
                style={{ width: `${r.score}%` }}
                aria-hidden="true"
              />
            </div>
            <span
              data-numeric
              className="w-7 shrink-0 text-right font-mono text-xs text-foreground"
            >
              {r.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A tiny pager vignette: the one-pick rhythm without the machinery. */
function PagerVignette() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-4 rounded-lg bg-background/60 p-4 ring-1 ring-foreground/10"
    >
      <span className="flex size-8 items-center justify-center rounded-full ring-1 ring-foreground/15">
        <ChevronLeft className="size-4 text-muted-foreground" strokeWidth={2} />
      </span>
      <span data-numeric className="font-mono text-sm text-foreground">
        3 / 5
      </span>
      <span className="flex size-8 items-center justify-center rounded-full ring-1 ring-foreground/15">
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
    title: "It tells you why",
    body: "Every pick comes with its reasons: the keywords, people, and films behind it. No other app explains itself.",
    vignette: (
      <div className="rounded-lg bg-background/60 p-4 ring-1 ring-foreground/10">
        <ReasonChips
          reasons={[
            { kind: "keyword", id: 1, name: "slow-burn" },
            { kind: "keyword", id: 2, name: "unreliable narrator" },
            { kind: "keyword", id: 3, name: "because you liked Parasite" },
          ]}
        />
      </div>
    ),
  },
  {
    title: "Track TV properly",
    body: "Season by season, the way you actually watch it. A great first season and a weak fourth stay two different numbers.",
    vignette: <SeasonsVignette />,
  },
  {
    title: "One pick, not a feed",
    body: "Ask for three, five, or seven. Step through them and press play on one. No endless rows engineered to keep you browsing.",
    vignette: <PagerVignette />,
  },
];

export function FeaturesRow() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Genre is a terrible way to pick a film
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          You do not love thrillers, you love slow-burn thrillers with an
          unreliable narrator. Klyvi works from what actually predicts your
          taste: keywords, cast, and the films you rated highly.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col justify-between gap-6 rounded-lg bg-card p-6 ring-1 ring-foreground/10"
          >
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
            {f.vignette}
          </div>
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
        <p className="relative mx-auto mt-4 max-w-md text-base text-muted-foreground">
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
    </section>
  );
}
