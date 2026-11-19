import Image from "next/image";

import { ProseLayout } from "@/components/klyvi/prose-layout";

export const metadata = {
  title: "Attribution \u00b7 Klyvi",
  alternates: { canonical: "/attribution" },
};

export default function AttributionPage() {
  return (
    <ProseLayout title="Third-party data and attribution" updated="19 November 2026">
      <h2>TMDB</h2>
      {/* TMDB's own logo, unchanged and no more prominent than Klyvi's
          mark, as its API terms ask. */}
      <a
        href="https://www.themoviedb.org"
        aria-label="TMDB"
        className="mb-4 inline-flex rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Image
          src="/tmdb-logo.svg"
          alt="TMDB"
          width={123}
          height={16}
          unoptimized
          className="h-4 w-auto"
        />
      </a>
      <p>
        Film and television data, posters, and images are provided by The
        Movie Database (TMDB).
      </p>
      <p>
        <strong>
          This website uses TMDB and the TMDB APIs but is not endorsed,
          certified, or otherwise approved by TMDB.
        </strong>
      </p>

      <h2>Wikidata</h2>
      <p>
        Some facts about films and shows, such as their setting, subject and
        source material, come from Wikidata and are available under the
        Creative Commons CC0 License.
      </p>

      <h2>Wikipedia</h2>
      <p>
        Klyvi finds films and shows with similar stories by comparing the plot
        sections of their English Wikipedia articles. That text is by
        Wikipedia&apos;s contributors and is available under the{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">
          Creative Commons Attribution-ShareAlike 4.0 License
        </a>
        . Klyvi keeps a numeric summary of each plot, not the text itself.
      </p>

      <h2>Type</h2>
      <p>
        Geist Sans and Geist Mono, used under the SIL Open Font License.
      </p>

      <h2>Open source</h2>
      <p>
        Klyvi is built on open-source software including Next.js, React,
        Tailwind CSS, Base UI, Lucide, and shadcn/ui, each under its own
        license. The full text of{" "}
        <a href="/third-party-notices.txt">the license of every package</a>{" "}
        this site ships is in one file.
      </p>
    </ProseLayout>
  );
}
