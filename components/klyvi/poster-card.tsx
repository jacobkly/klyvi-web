import Image from "next/image";
import Link from "next/link";

import {
  STATUS_LABELS,
  posterUrl,
  type MediaSummary,
  type TrackingStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
 * Missing artwork is a first-class state, not a broken image: a muted block
 * with the title set in it. TMDB has gaps and freshly-tracked entries can
 * arrive before their art does.
 */
function PosterCard({
  media,
  variant,
  status,
  progress,
  className,
}: {
  media: MediaSummary;
  variant: "overlay" | "below" | "compact";
  status?: TrackingStatus;
  progress?: { watched: number; total: number | null };
  className?: string;
}) {
  const href =
    media.mediaType === "season"
      ? `/tv/${media.tmdbId}/season/${media.seasonNumber ?? 1}`
      : `/movie/${media.tmdbId}`;
  const src = posterUrl(media.posterPath);
  const seasonSuffix =
    media.mediaType === "season" && media.seasonNumber != null
      ? ` Season ${media.seasonNumber}`
      : "";
  const accessibleName = `${media.title}${seasonSuffix}`;

  const progressText = progress
    ? progress.total != null
      ? `${progress.watched} / ${progress.total}`
      : `${progress.watched}`
    : null;

  return (
    <Link
      href={href}
      aria-label={variant === "below" ? undefined : accessibleName}
      className={cn(
        "group block outline-none focus-visible:ring-3 focus-visible:ring-ring/30 rounded-art",
        className
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
            className="object-cover transition-transform duration-(--dur-base) group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center">
            <span className="text-xs leading-snug text-muted-foreground">
              {media.title}
              {seasonSuffix}
            </span>
          </div>
        )}

        {status ? (
          <span
            aria-label={STATUS_LABELS[status]}
            className="absolute top-1.5 left-1.5 block size-2 rounded-full ring-2 ring-black/50"
            style={{ backgroundColor: `var(--status-${status === "rewatching" ? "watching" : status})` }}
          />
        ) : null}

        {variant === "overlay" && src ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-8 pb-2">
            <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
              {media.title}
              {seasonSuffix}
            </p>
            {progressText ? (
              <p
                data-numeric
                className="mt-0.5 font-mono text-[11px] text-violet-text"
              >
                {progressText}
              </p>
            ) : null}
          </div>
        ) : null}

        {variant !== "overlay" && progressText ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5">
            <p data-numeric className="font-mono text-[11px] text-violet-text">
              {progressText}
            </p>
          </div>
        ) : null}
      </div>

      {variant === "below" ? (
        <div className="mt-1.5">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
            {media.title}
            {seasonSuffix}
          </p>
          {media.year != null ? (
            <p data-numeric className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {media.year}
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

export { PosterCard };
