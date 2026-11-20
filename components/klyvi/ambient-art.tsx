import Image from "next/image";

import { tmdbImage } from "@/lib/tmdb-image";

/**
 * The artwork as the room's light: a blurred, dimmed copy of an image fixed
 * behind the page, fading to the background toward the bottom. It gives the
 * glass bars and panels something to catch. Decorative, so it is hidden from
 * screen readers, and it steps aside for people who ask for less
 * transparency. A new image fades in rather than snapping.
 */
export function AmbientArt({ path }: { path: string | null | undefined }) {
  const src = tmdbImage(path);
  if (!src) return null;
  return (
    <div
      aria-hidden="true"
      data-slot="ambient-art"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:duration-(--dur-slow) [@media(prefers-reduced-transparency:reduce)]:hidden"
    >
      <Image
        key={src}
        src={src}
        alt=""
        fill
        sizes="40vw"
        className="scale-125 object-cover opacity-30 blur-3xl saturate-150"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/65 to-background/90" />
    </div>
  );
}
