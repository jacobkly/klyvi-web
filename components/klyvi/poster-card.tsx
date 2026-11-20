import Link from "next/link";
import {
  Bookmark,
  Check,
  Pause,
  Play,
  RotateCcw,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  STATUS_LABELS,
  type MediaSummary,
  type TrackingStatus,
} from "@/lib/types";
import {
  FadeImage,
  PosterActions,
  type PosterAction,
} from "@/components/klyvi/poster-parts";
import { ScoreValue } from "@/components/klyvi/score-value";
import { mediaHref } from "@/lib/media-href";
import { cn } from "@/lib/utils";
import { tmdbImage } from "@/lib/tmdb-image";

/** Each status has its own shape, so it never rests on color alone. */
const STATUS_GLYPHS: Record<TrackingStatus, LucideIcon> = {
  watching: Play,
  planning: Bookmark,
  completed: Check,
  rewatching: RotateCcw,
  paused: Pause,
  dropped: X,
};

function StatusGlyph({ status }: { status: TrackingStatus }) {
  const Glyph = STATUS_GLYPHS[status];
  return (
    <span
      role="img"
      aria-label={STATUS_LABELS[status]}
      data-status={status}
      className="inline-flex"
      style={{
        color: `var(--status-${status === "rewatching" ? "watching" : status})`,
      }}
    >
      <Glyph aria-hidden="true" className="size-3" strokeWidth={2.5} />
    </span>
  );
}

/**
 * The atom of the app. Three variants (04-components.md §4):
 *
 * - `overlay`: title in a scrim over the artwork. Library, where content is
 *   already known and density wins.
 * - `below`: title under the artwork, two-line clamp. Explore, rails, Find
 *   Next, where the name carries the weight.
 * - `compact`: artwork only, maximum density. Accessible name stays on the
 *   link.
 *
 * One badge carries what you've said about the title: a status glyph, then
 * episode progress, then your score. It rides the scrim in overlay and sits
 * bottom-left on the artwork otherwise. The season tag is top-left and the
 * quick-actions menu, when given, is top-right.
 *
 * Missing artwork is a first-class state, not a broken image: a muted block
 * with the title set in it. TMDB has gaps and freshly-tracked entries can
 * arrive before their art does.
 */
function PosterCard({
  media,
  variant,
  status,
  progress,
  score,
  actions,
  current = false,
  kind,
  label,
  eager = false,
  sizes = "(max-width: 640px) 38vw, (max-width: 1024px) 24vw, 180px",
  className,
}: {
  media: MediaSummary;
  variant: "overlay" | "below" | "compact";
  status?: TrackingStatus;
  progress?: { watched: number; total: number | null };
  /** The user's own score (0..100). Null renders nothing. */
  score?: number | null;
  /** Quick actions for the corner menu. None, no menu. */
  actions?: PosterAction[];
  /** The title whose page this is, in a row of its siblings: ringed, and
   *  labelled "This film" under the year (below only). */
  current?: boolean;
  /** "Film" or "Series" beside the year where a shelf mixes both (below
   *  only). */
  kind?: string;
  /** The visible name in place of title and season, where the page already
   *  names the show ("Season 2" on the series page). */
  label?: string;
  /** In the first screen: load now, ahead of the lazy ones below. */
  eager?: boolean;
  /** The slot's width for the srcset. The default fits rails and grids:
   *  3 to 3.3 across on a phone, 4 to 5 on a tablet, 180px above that. */
  sizes?: string;
  className?: string;
}) {
  const href = mediaHref(media);
  const src = tmdbImage(media.posterPath);
  const seasonSuffix =
    media.mediaType === "season" && media.seasonNumber != null
      ? ` Season ${media.seasonNumber}`
      : "";
  const accessibleName = `${media.title}${seasonSuffix}`;
  const shownName = label ?? accessibleName;

  const progressText = progress
    ? progress.total != null
      ? `${progress.watched} / ${progress.total}`
      : `${progress.watched}`
    : null;

  const inScrim = variant === "overlay" && src != null;
  // Below shows progress in its meta row, next to the year.
  const badgeProgress = variant === "below" ? null : progressText;
  const hasBadge = status != null || badgeProgress != null || score != null;

  return (
    <div
      className={cn(
        "group relative transition-transform duration-(--dur-base) ease-(--ease-enter) pointer-fine:hover:-translate-y-1",
        className
      )}
    >
      <Link
        href={href}
        aria-label={variant === "below" ? undefined : accessibleName}
        aria-current={current ? "page" : undefined}
        className="block rounded-art outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div
          className={cn(
            "relative aspect-[2/3] overflow-hidden rounded-art bg-muted",
            current ? "ring-2 ring-primary" : "ring-1 ring-foreground/10"
          )}
        >
          {src ? (
            <FadeImage
              src={src}
              alt=""
              fill
              sizes={sizes}
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : undefined}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center">
              <span className="text-xs leading-snug text-muted-foreground">
                {accessibleName}
              </span>
            </div>
          )}

          {/* Seasons of the same show usually share one poster, so the
              artwork alone cannot say which season this is. The tag carries
              it in every variant, including compact where there is no title
              at all. Top-left, opposite the quick-actions menu. */}
          {media.mediaType === "season" && media.seasonNumber != null ? (
            <span
              aria-hidden="true"
              data-numeric
              className="absolute top-1 left-1 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium text-white"
            >
              S{media.seasonNumber}
            </span>
          ) : null}

          {inScrim ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-8 pb-2">
              <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
                {shownName}
              </p>
              {hasBadge ? (
                <div className="mt-1 flex items-center gap-1.5">
                  {status ? <StatusGlyph status={status} /> : null}
                  {/* Episode progress (TV only): violet, the app speaking. */}
                  {progressText ? (
                    <span data-numeric className="font-mono text-[11px] text-violet-text">
                      {progressText}
                    </span>
                  ) : null}
                  {/* Your score: neutral (user data, not the app), on the
                      right where a rating is read. The star names it, so it
                      can never be mistaken for a count. */}
                  {score != null ? (
                    <ScoreValue
                      score={score}
                      mine
                      className="ml-auto font-mono text-[11px] font-medium text-white"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : hasBadge ? (
            <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-sm bg-black/70 px-1 py-0.5 font-mono text-[10px] leading-none font-medium">
              {status ? <StatusGlyph status={status} /> : null}
              {badgeProgress ? (
                <span data-numeric className="text-violet-text">
                  {badgeProgress}
                </span>
              ) : null}
              {score != null ? (
                <ScoreValue score={score} mine className="text-white" />
              ) : null}
            </span>
          ) : null}
        </div>

        {variant === "below" ? (
          <div className="mt-1.5">
            <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
              {shownName}
            </p>
            {media.year != null || progressText || kind || current ? (
              <div className="mt-0.5 flex items-center gap-2">
                {media.year != null || kind || current ? (
                  <p className="text-[11px] text-muted-foreground">
                    {media.year != null ? (
                      <span data-numeric className="font-mono">
                        {media.year}
                      </span>
                    ) : null}
                    {[kind, current ? "This film" : null]
                      .filter(Boolean)
                      .map((label, i) => (
                        <span key={i}>
                          {media.year != null || i > 0 ? " · " : ""}
                          {label}
                        </span>
                      ))}
                  </p>
                ) : null}
                {/* Episode progress (TV only), violet like the overlay's. */}
                {progressText ? (
                  <span data-numeric className="ml-auto font-mono text-[11px] text-violet-text">
                    {progressText}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Link>

      {actions && actions.length > 0 ? (
        <PosterActions name={accessibleName} actions={actions} />
      ) : null}
    </div>
  );
}

export { PosterCard };
export type { PosterAction };
