import Image from "next/image";

import { shortDate } from "@/lib/media-facts";
import { formatRuntime } from "@/lib/mock-media";
import { tmdbImage } from "@/lib/tmdb-image";
import type { Episode } from "@/lib/types";

/**
 * A season's episodes in airing order: still, number, name, date and
 * runtime. While the season airs, the next episode carries a marker.
 */
export function EpisodeList({
  episodes,
  next,
}: {
  episodes: Episode[];
  /** The number of this season's next episode to air, if it has one. */
  next: number | null;
}) {
  if (episodes.length === 0) return null;
  return (
    <section aria-labelledby="episodes-heading" className="mb-10">
      <div className="mb-4 flex items-center gap-4">
        <h2
          id="episodes-heading"
          className="shrink-0 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground"
        >
          Episodes
        </h2>
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <ol aria-label="Episodes" className="flex flex-col gap-4">
        {episodes.map((e) => (
          <EpisodeRow key={e.number} episode={e} isNext={e.number === next} />
        ))}
      </ol>
    </section>
  );
}

function EpisodeRow({ episode, isNext }: { episode: Episode; isNext: boolean }) {
  const still = tmdbImage(episode.stillPath);
  const date = shortDate(episode.airDate);
  const runtime = formatRuntime(episode.runtime);
  return (
    <li className="flex gap-3 sm:gap-4">
      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 sm:w-40">
        {still ? (
          <Image
            src={still}
            alt=""
            fill
            sizes="(max-width: 640px) 112px, 160px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            E{episode.number}
          </span>
          <h3 className="text-sm font-medium text-foreground">
            {episode.name ?? `Episode ${episode.number}`}
          </h3>
          {isNext ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              Next
            </span>
          ) : null}
        </div>
        {date || runtime ? (
          <p className="mt-1 flex gap-3 font-mono text-xs text-muted-foreground tabular-nums">
            {date ? <span>{date}</span> : null}
            {runtime ? <span>{runtime}</span> : null}
          </p>
        ) : null}
        {episode.overview ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {episode.overview}
          </p>
        ) : null}
      </div>
    </li>
  );
}
