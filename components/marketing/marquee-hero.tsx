"use client";

import Link from "next/link";
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { buttonVariants } from "@/components/ui/button";
import { getMovieList } from "@/lib/api/catalog";
import { TAGLINE_CLAIM } from "@/lib/marketing-claims";
import { MOCK_POOL } from "@/lib/mock-onboarding";

/**
 * The marquee hero, adapted from the 21st.dev AnimatedMarqueeHero the user
 * supplied and reskinned to Klyvi: real Button, art radius, no shadows, no
 * vendor colors. Posters are live popular films when the API answers, the
 * local pool otherwise. Reduced motion renders everything static.
 */

const FADE = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

const TITLE = "Stop scrolling. Start watching.";

export function MarqueeHero() {
  const reduced = useReducedMotion();
  const [posters, setPosters] = React.useState<string[]>(() =>
    MOCK_POOL.filter((p) => p.posterPath)
      .slice(0, 14)
      .map((p) => p.posterPath as string)
  );

  React.useEffect(() => {
    const ac = new AbortController();
    getMovieList("popular", ac.signal)
      .then((list) => {
        const paths = list
          .map((m) => m.posterPath)
          .filter((p): p is string => p != null)
          .slice(0, 14);
        if (paths.length >= 8) setPosters(paths);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // Two copies of the strip make the loop seamless: animating to -50%
  // lands exactly where copy two began. The animated element must be the
  // w-max strip itself, because transform percentages resolve against the
  // element's own box, and a block wrapper would be viewport-wide.
  const items = [...posters, ...posters].map((poster, index) => (
    <div
      key={`${poster}-${index}`}
      className="relative aspect-[2/3] h-48 shrink-0 overflow-hidden rounded-art ring-1 ring-foreground/10 md:h-64"
      style={{ rotate: `${index % 2 === 0 ? -2 : 3}deg` }}
    >
      {/* Plain img over next/image: fourteen tiny posters do not need
          per-image optimization negotiation, and the marquee remounts
          them when the live list lands. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://image.tmdb.org/t/p/w342${poster}`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  ));

  return (
    <section className="relative flex min-h-[88dvh] w-full flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="z-10 flex flex-col items-center pb-52 md:pb-64">
        <motion.div
          initial={reduced ? false : "hidden"}
          animate="show"
          variants={FADE}
          className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
        >
          {TAGLINE_CLAIM}
        </motion.div>

        {reduced ? (
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            {TITLE}
          </h1>
        ) : (
          <motion.h1
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
          >
            {TITLE.split(" ").map((word, i) => (
              <motion.span key={i} variants={FADE} className="inline-block">
                {word}&nbsp;
              </motion.span>
            ))}
          </motion.h1>
        )}

        <motion.p
          initial={reduced ? false : "hidden"}
          animate="show"
          variants={FADE}
          transition={{ delay: 0.4 }}
          className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Klyvi learns what you actually like and tells you what to watch
          right now, with the reason it picked it.
        </motion.p>

        <motion.div
          initial={reduced ? false : "hidden"}
          animate="show"
          variants={FADE}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-4"
        >
          <Link href="/signup" className={buttonVariants({ size: "touch" })}>
            Get started
          </Link>
          <Link
            href="/signin"
            className="tap-target inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </motion.div>

        <p className="mt-10 font-mono text-xs text-muted-foreground">
          Film and TV data from TMDB
        </p>
      </div>

      {/* The poster marquee along the bottom, faded in and out at the
          edges. The fade is a mask, not decoration: it keeps the strip
          from ending in a hard cut. */}
      <div className="absolute bottom-0 left-0 h-56 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] md:h-72">
        {reduced ? (
          <div className="flex w-max gap-4">{items}</div>
        ) : (
          <motion.div
            className="flex w-max gap-4 will-change-transform"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 60, repeat: Infinity }}
          >
            {items}
          </motion.div>
        )}
      </div>
    </section>
  );
}
