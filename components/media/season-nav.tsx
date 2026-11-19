"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Ties a season page to its series: a breadcrumb back to the show, steps to
 * the seasons either side, and a menu of every season. Specials (season 0)
 * are already left out of the series' season list.
 */
export function SeasonNav({
  tmdbId,
  seriesTitle,
  seasons,
  current,
}: {
  tmdbId: number;
  seriesTitle: string;
  seasons: { seasonNumber: number }[];
  current: number;
}) {
  const numbers = seasons
    .map((s) => s.seasonNumber)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const i = numbers.indexOf(current);
  const prev = i > 0 ? numbers[i - 1] : null;
  const next = i >= 0 && i < numbers.length - 1 ? numbers[i + 1] : null;
  const href = (n: number) => `/tv/${tmdbId}/season/${n}`;
  const step = cn(
    buttonVariants({ variant: "ghost", size: "icon-sm" }),
    "hit-44 relative"
  );

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <Breadcrumb aria-label="Breadcrumb" className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbLink
              render={<Link href={`/tv/${tmdbId}`} />}
              className="truncate outline-none focus-visible:ring-3 focus-visible:ring-ring/30 rounded-sm"
            >
              {seriesTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Season {current}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {numbers.length > 1 ? (
        <div className="flex items-center gap-1">
          {prev != null ? (
            <Link
              href={href(prev)}
              aria-label={`Previous season, Season ${prev}`}
              className={step}
            >
              <ChevronLeft aria-hidden="true" />
            </Link>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={
                i >= 0
                  ? `Season ${current} of ${numbers.length}, pick a season`
                  : "Pick a season"
              }
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hit-44 relative font-mono tabular-nums"
              )}
            >
              {i >= 0 ? `S${current} / ${numbers.length}` : "Seasons"}
              <ChevronDown aria-hidden="true" data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 min-w-40">
              {numbers.map((n) => (
                <DropdownMenuItem
                  key={n}
                  render={<Link href={href(n)} />}
                  aria-current={n === current ? "page" : undefined}
                  className={cn(n === current && "text-primary")}
                >
                  Season {n}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {next != null ? (
            <Link
              href={href(next)}
              aria-label={`Next season, Season ${next}`}
              className={step}
            >
              <ChevronRight aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
