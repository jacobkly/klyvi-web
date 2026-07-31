import Image from "next/image";
import type { ReactNode } from "react";

import { MOCK_POOL } from "@/lib/mock-onboarding";

/**
 * The split auth layout: form column on the left half, artwork on the
 * right. The art is the poster wall, the same visual language as the
 * marketing hero, because in a catalog product the covers ARE the palette
 * ("Dark Room": the posters are the only light source).
 *
 * Below lg the wall does not disappear, it goes full-bleed behind the form
 * under a heavier scrim, so mobile keeps the same atmosphere at a contrast
 * the body copy can survive.
 *
 * min-h-dvh, not min-h-full: the parent chain has no fixed height, so a
 * percentage min-height resolves to auto and the panel collapses to content
 * height. Viewport units cannot collapse.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  // The pool is only ~20 deep, which leaves short rows at the bottom of a
  // tall panel. Repeat it so the grid always overflows at every breakpoint.
  const posters = MOCK_POOL.filter((p) => p.posterPath);
  const wall = Array.from(
    { length: 36 },
    (_, i) => posters[i % posters.length]
  );

  return (
    <div className="relative flex min-h-dvh">
      {/* Full-bleed on mobile, right half at lg. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden lg:left-1/2"
      >
        <div
          className="absolute -inset-8 grid grid-cols-4 gap-3 opacity-50 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5"
          style={{ transform: "rotate(-4deg) scale(1.12)" }}
        >
          {wall.map((p, i) => (
            <div
              key={i}
              className="relative aspect-[2/3] overflow-hidden rounded-art"
            >
              <Image
                src={`https://image.tmdb.org/t/p/w342${p.posterPath}`}
                alt=""
                fill
                sizes="(max-width: 1024px) 33vw, 20vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {/* Mobile: an even scrim heavy enough for text to sit on top.
            Desktop: melts into the form column on the left. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/85 to-background/92 lg:bg-gradient-to-r lg:from-background lg:via-background/45 lg:to-background/15" />
        {/* Keeps the tagline readable over whatever poster lands there. */}
        <div className="absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t from-background/85 to-transparent lg:block" />
        <p className="absolute right-10 bottom-8 hidden text-sm text-muted-foreground lg:block">
          Know what to watch right now.
        </p>
      </div>

      {/* The form block centres in its column at every width, so its midpoint
          lands on the quarter line of the page at lg. Tried a 2/3 column
          (midpoint on the third line) and it read as off-balance against the
          artwork, so the halves stay. */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:shrink-0 lg:px-10">
        <div className="mx-auto w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
