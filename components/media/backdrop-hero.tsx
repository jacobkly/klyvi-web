import Image from "next/image";
import type { ReactNode } from "react";

/**
 * The cinematic detail header: full-bleed backdrop with a scrim into the page
 * background, overlapping poster slot, and the title block beside it. When
 * there is no backdrop the layout closes up quietly (06-copy.md: no copy).
 */
function BackdropHero({
  backdropPath,
  children,
}: {
  backdropPath: string | null;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {backdropPath ? (
        <div className="absolute inset-x-0 top-0 h-56 overflow-hidden sm:h-72 lg:h-80">
          <Image
            src={`https://image.tmdb.org/t/p/w1280${backdropPath}`}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-background/60 to-background" />
        </div>
      ) : null}
      <div
        className={
          backdropPath
            ? "relative pt-36 sm:pt-44 lg:pt-52"
            : "relative pt-10"
        }
      >
        {children}
      </div>
    </div>
  );
}

export { BackdropHero };
