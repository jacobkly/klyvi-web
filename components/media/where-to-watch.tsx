"use client";

import Image from "next/image";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getProviders } from "@/lib/api/catalog";
import { tmdbImage } from "@/lib/tmdb-image";
import type { WatchProvider, WatchProviders } from "@/lib/types";
import {
  initialRegion,
  regionName,
  saveRegion,
} from "@/lib/watch-region";

const KINDS: { key: keyof Pick<WatchProviders, "stream" | "free" | "ads" | "rent" | "buy">; label: string }[] = [
  { key: "stream", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "ads", label: "With ads" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

/** TMDB's terms for this data: credit JustWatch wherever it shows. */
const JUSTWATCH = "https://www.justwatch.com/";

/** The answer to one request, tagged with what was asked. */
type Answer =
  | { key: string; status: "error" }
  | { key: string; status: "ready"; data: WatchProviders | null };

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: WatchProviders | null };

const subscribeNever = () => () => {};

/**
 * Where a title streams, rents or sells in one country. The country is the
 * one you picked last, else your browser's, else the US. The data is
 * JustWatch's, via TMDB, and the credit shows whenever the section does.
 */
export function WhereToWatch({
  kind,
  tmdbId,
  title,
}: {
  kind: "movies" | "tv";
  tmdbId: number;
  title: string;
}) {
  // The browser's country is known only after hydration, so the server and
  // the first client render show the skeleton.
  const browserRegion = React.useSyncExternalStore(
    subscribeNever,
    initialRegion,
    () => null
  );
  const [picked, setPicked] = React.useState<string | null>(null);
  const region = picked ?? browserRegion;
  const [attempt, setAttempt] = React.useState(0);
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const headingId = React.useId();

  const key = region ? `${kind}/${tmdbId}/${region}/${attempt}` : null;
  React.useEffect(() => {
    if (!region || !key) return;
    const ctl = new AbortController();
    getProviders(kind, tmdbId, region, ctl.signal)
      .then((data) => {
        if (!ctl.signal.aborted) setAnswer({ key, status: "ready", data });
      })
      .catch(() => {
        if (!ctl.signal.aborted) setAnswer({ key, status: "error" });
      });
    return () => ctl.abort();
  }, [kind, tmdbId, region, key]);

  // Anything not answering the current request is still loading.
  const state: State =
    !answer || answer.key !== key
      ? { status: "loading" }
      : answer.status === "error"
        ? { status: "error" }
        : { status: "ready", data: answer.data };

  const data = state.status === "ready" ? state.data : null;
  // No offers in any country (or no such title): nothing worth a section.
  if (state.status === "ready" && (!data || data.regions.length === 0)) {
    return null;
  }

  const groups = data
    ? KINDS.map((k) => ({ ...k, items: data[k.key] })).filter(
        (g) => g.items.length > 0
      )
    : [];

  const regions = data
    ? Array.from(new Set([...data.regions, data.region])).sort((a, b) =>
        regionName(a).localeCompare(regionName(b))
      )
    : [];
  const names = Object.fromEntries(regions.map((r) => [r, regionName(r)]));

  return (
    <section aria-labelledby={headingId} className="mb-10">
      <div className="mb-4 flex items-center gap-4">
        <h2
          id={headingId}
          className="shrink-0 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground"
        >
          Where to watch
        </h2>
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
        {data && region ? (
          <Select
            value={region}
            onValueChange={(v) => {
              if (typeof v !== "string" || !v) return;
              saveRegion(v);
              setPicked(v);
            }}
            items={names}
          >
            <SelectTrigger
              aria-label="Country"
              size="sm"
              className="hit-44 relative max-w-48 shrink-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {names[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {state.status === "loading" ? (
        <div className="flex gap-3" aria-busy="true" aria-label="Loading where to watch">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="size-12 rounded-art" />
          ))}
        </div>
      ) : state.status === "error" ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <p>Couldn&apos;t load where to watch.</p>
          <Button
            variant="outline"
            size="sm"
            className="hit-44 relative"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          {groups.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groups.map((g) => (
                <div
                  key={g.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4"
                >
                  <span className="shrink-0 pt-1 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground sm:w-36">
                    {g.label}
                  </span>
                  <ul aria-label={g.label} className="flex flex-wrap gap-3">
                    {g.items.map((p) => (
                      <ProviderTile key={p.id} provider={p} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No streaming, rental or purchase options for {title} in{" "}
              {regionName(region ?? "")} right now. Pick another country to see
              where it is.
            </p>
          )}

          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Streaming data by{" "}
              <a
                href={JUSTWATCH}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                JustWatch
              </a>
            </span>
            {data?.link ? (
              <a
                href={data.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                See every option on TMDB
              </a>
            ) : null}
          </p>
        </>
      )}
    </section>
  );
}

function ProviderTile({ provider }: { provider: WatchProvider }) {
  const logo = tmdbImage(provider.logoPath);
  return (
    <li className="flex w-16 flex-col items-center gap-1.5 text-center">
      <div className="relative size-12 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
        {logo ? (
          <Image src={logo} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center text-sm font-medium text-muted-foreground"
          >
            {provider.name.slice(0, 1)}
          </span>
        )}
      </div>
      <span className="line-clamp-2 text-xs leading-tight text-foreground/90">
        {provider.name}
      </span>
    </li>
  );
}
