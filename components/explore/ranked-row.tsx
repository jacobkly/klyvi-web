import Image from "next/image";
import { Film } from "lucide-react";

import type { RankedTitle } from "@/lib/mock-top100";
import { cn } from "@/lib/utils";

/**
 * One row of a Top 100 list: rank numeral, poster thumb, title block,
 * score. The rank column is fixed-width mono so 7, 42, and 100 all sit on
 * the same grid. Handles the awaiting-ranking state, which is every row
 * until the backend computes the list.
 */
export function RankedRow({ item }: { item: RankedTitle }) {
  const missing = item.title == null;
  return (
    <li className="flex items-center gap-4 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <span
        data-numeric
        className="w-12 shrink-0 text-right font-mono text-lg text-muted-foreground"
      >
        #{item.rank}
      </span>

      <div
        className={cn(
          "relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-art",
          missing && "flex items-center justify-center bg-muted/60"
        )}
      >
        {item.posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w154${item.posterPath}`}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <Film
            aria-hidden="true"
            strokeWidth={2}
            className="size-4 text-muted-foreground/60"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {missing ? (
          <>
            <p className="text-sm text-muted-foreground">Not ranked yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              Waiting on the ranking backend
            </p>
          </>
        ) : (
          <>
            <p className="truncate text-sm font-medium text-foreground">
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[item.year, item.genres.slice(0, 3).join(", ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        )}
      </div>

      {item.score != null ? (
        <span
          data-numeric
          className="shrink-0 font-mono text-sm text-foreground"
        >
          {item.score}
          <span className="text-muted-foreground"> / 100</span>
        </span>
      ) : (
        <span
          data-numeric
          aria-hidden="true"
          className="shrink-0 font-mono text-sm text-muted-foreground/50"
        >
          –
        </span>
      )}
    </li>
  );
}
