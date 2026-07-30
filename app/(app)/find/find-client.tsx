"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/klyvi/empty-state";
import { RecommendationCard } from "@/components/find/recommendation-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  mockFeed,
  mockInteractionCount,
  type RecoTier,
  type Scored,
} from "@/lib/mock-reco";

const TIER_THRESHOLD = 20; // klyvi/docs/API.md: Tier 2 at >= 20 interactions.

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; picks: Scored[] };

/**
 * Find Next: the calm "here is the answer" surface. A count selector, one
 * primary action, few large cards with prominent reasons. Honest about all
 * three recommender tiers, and about TV (06-copy.md).
 */
export function FindClient({ simulate }: { simulate?: string }) {
  const tier: RecoTier =
    simulate === "tier0" ? 0 : simulate === "tier2" ? 2 : 1;
  const [count, setCount] = React.useState<3 | 5 | 7>(5);
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });
  const [moreOpen, setMoreOpen] = React.useState(false);

  const interactions = mockInteractionCount(tier);
  const remaining = Math.max(0, TIER_THRESHOLD - interactions);

  function fetchPicks() {
    setPhase({ kind: "loading" });
    setTimeout(() => {
      if (simulate === "error") setPhase({ kind: "error" });
      else if (simulate === "exhausted") setPhase({ kind: "ready", picks: [] });
      else setPhase({ kind: "ready", picks: mockFeed(tier, count) });
    }, 500);
  }

  function remove(item: Scored, message?: string) {
    if (phase.kind !== "ready") return;
    setPhase({
      kind: "ready",
      picks: phase.picks.filter((p) => p.mediaId !== item.mediaId),
    });
    if (message) toast(message);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Find your next watch
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">How many?</span>
        <ToggleGroup
          value={[String(count)]}
          onValueChange={(v: unknown[]) => {
            const n = Number(v.at(-1));
            if (n === 3 || n === 5 || n === 7) setCount(n);
          }}
          spacing={0}
          variant="outline"
          aria-label="How many picks"
        >
          {[3, 5, 7].map((n) => (
            <ToggleGroupItem key={n} value={String(n)} className="font-mono">
              {n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button size="touch" onClick={fetchPicks} className="gap-2">
          <Sparkles aria-hidden="true" data-icon="inline-start" />
          Show me
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          More options
        </Button>
      </div>

      {moreOpen ? (
        <div className="mt-4 rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Films only for now. Klyvi tracks TV but does not recommend it yet.
          </p>
        </div>
      ) : null}

      <div className="mt-8">
        {phase.kind === "idle" ? (
          <p className="text-sm text-muted-foreground">
            Pick a number and Klyvi finds something worth your evening.
          </p>
        ) : null}

        {phase.kind === "loading" ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : null}

        {phase.kind === "error" ? (
          <div className="py-16 text-center">
            <p className="text-[15px] font-semibold text-foreground">
              Could not get your recommendations.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Something went wrong on Klyvi&apos;s end.
            </p>
            <Button className="mt-5" onClick={fetchPicks}>
              Try again
            </Button>
          </div>
        ) : null}

        {phase.kind === "ready" && phase.picks.length === 0 ? (
          interactions === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Not enough to go on yet"
              body="Rate about 20 films and Klyvi can make a real recommendation. It takes about 90 seconds."
              action={{ label: "Start rating", href: "/onboarding/rate" }}
            />
          ) : (
            <EmptyState
              icon={Sparkles}
              title="You have seen everything Klyvi has for you"
              body="You have been through every pick in your current taste profile. Rate a few more titles and new ones open up."
              action={{ label: "Go to your library", href: "/library" }}
            />
          )
        ) : null}

        {phase.kind === "ready" && phase.picks.length > 0 ? (
          <div className="flex flex-col gap-4">
            {tier === 0 ? (
              <p className="text-sm text-muted-foreground">
                These are picks people tend to agree on. Rate a few and Klyvi
                starts explaining why it picked things for you specifically.
              </p>
            ) : null}

            {phase.picks.map((p) => (
              <RecommendationCard
                key={p.mediaId}
                item={p}
                onSave={(i) => remove(i, "Added to your watchlist")}
                onDismiss={(i) => remove(i, "Hidden from your recommendations")}
                onSeen={(i) => remove(i)}
              />
            ))}

            {tier === 1 ? (
              <p data-numeric className="text-sm text-muted-foreground">
                {remaining} more {remaining === 1 ? "rating" : "ratings"} and
                Klyvi switches to your full taste profile.
              </p>
            ) : null}

            <Button variant="outline" onClick={fetchPicks} className="self-start">
              Try another set
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
