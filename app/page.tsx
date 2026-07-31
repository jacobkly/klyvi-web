import Image from "next/image";
import Link from "next/link";

import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SiteFooter } from "@/components/klyvi/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { MOCK_POOL } from "@/lib/mock-onboarding";

export const metadata = {
  title: "Klyvi · Know what to watch right now",
  description:
    "Klyvi learns what you actually like and tells you what to watch right now, with the reason it picked it.",
};

const STEPS = [
  {
    heading: "Rate about 20 films",
    body: "Roughly 90 seconds. Liked it, not for me, not seen.",
  },
  {
    heading: "Get a real recommendation",
    body: "A short list, not an endless feed.",
  },
  {
    heading: "See why it picked them",
    body: "Every pick comes with the reason.",
  },
];

/**
 * The marketing one-pager (archetype A). The hero visual is the poster wall:
 * real cover art, dimmed, with the copy over it. No gradients-as-decoration,
 * no glow, no fake logos, no invented user counts. Section rhythm is
 * deliberately uneven.
 */
export default function MarketingPage() {
  // Enough posters that the wall fills the taller hero even at 8 columns.
  const wall = MOCK_POOL.filter((p) => p.posterPath).slice(0, 24);

  return (
    <div className="flex min-h-full flex-col">
      {/* Floating pill nav: glass, not a bar. The collage should read
          through it, so the fill is a light scrim + blur, not a background. */}
      <header className="sticky top-4 z-40 mx-auto w-full max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between rounded-full border border-foreground/10 bg-background/30 px-6 backdrop-blur-lg">
          <span className="text-[15px] font-semibold tracking-tight">Klyvi</span>
          <div className="flex items-center gap-2">
            <Link
              href="/signin"
              className="tap-target inline-flex items-center rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with the poster wall */}
      <section className="relative -mt-[4.5rem] overflow-hidden pt-[4.5rem]">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-4 gap-3 p-4 opacity-45 sm:grid-cols-6 lg:grid-cols-8"
          style={{ transform: "rotate(-4deg) scale(1.15)" }}
        >
          {wall.map((p) => (
            <div
              key={p.tmdbId}
              className="relative aspect-[2/3] overflow-hidden rounded-art"
            >
              <Image
                src={`https://image.tmdb.org/t/p/w342${p.posterPath}`}
                alt=""
                fill
                sizes="180px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {/* Light enough that the artwork survives it; the copy sits in the
            gradient's darker lower half so contrast holds. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/65 to-background" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-44 pb-28 sm:pt-60 sm:pb-40">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Stop scrolling. Start watching.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Klyvi learns what you actually like and tells you what to watch
            right now, with the reason it picked it.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/signup" className={buttonVariants({ size: "touch" })}>
              Get started
            </Link>
            <Link
              href="/signin"
              className="tap-target inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-16 font-mono text-xs text-muted-foreground">
            Film and TV data from TMDB
          </p>
        </div>
      </section>

      {/* Why Klyvi */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Genre is a terrible way to pick a film
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Every other app asks what genre you are in the mood for. But you do
          not love thrillers, you love slow-burn thrillers with an unreliable
          narrator. Klyvi works from the things that actually predict what you
          will like: keywords, cast, and the specific films you rated highly.
        </p>
        <div className="mt-6">
          <ReasonChips
            reasons={[
              { kind: "keyword", id: 1, name: "slow-burn" },
              { kind: "keyword", id: 2, name: "unreliable narrator" },
              { kind: "keyword", id: 3, name: "because you liked Parasite" },
            ]}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.heading}>
              <p data-numeric className="font-mono text-xs text-violet-text">
                {i + 1}
              </p>
              <h3 className="mt-1 text-[15px] font-semibold">{s.heading}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Track it properly */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Track it properly, season by season
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          A great first season and a weak fourth should not collapse into one
          score. Klyvi tracks TV per season, so your ratings stay honest and
          the recommendations get better as a result.
        </p>
      </section>

      {/* Quiet proof */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-4 pb-24">
        <p className="text-sm text-muted-foreground">
          Free to use. No ads, no tracking pixels, no selling your data.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
