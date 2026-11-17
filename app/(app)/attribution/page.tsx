import Image from "next/image";

import { ProseLayout } from "@/components/klyvi/prose-layout";

export const metadata = { title: "Attribution \u00b7 Klyvi" };

export default function AttributionPage() {
  return (
    <ProseLayout title="Third-party data and attribution" updated="17 November 2026">
      <h2>TMDB</h2>
      {/* TMDB's own logo, unchanged and smaller than Klyvi's mark, as its
          API terms ask. */}
      <Image
        src="/tmdb-logo.svg"
        alt="TMDB"
        width={92}
        height={12}
        unoptimized
        className="mb-4 h-3 w-auto"
      />
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

      <h2>Type</h2>
      <p>
        Geist Sans and Geist Mono, used under the SIL Open Font License.
      </p>

      <h2>Open source</h2>
      <p>
        Klyvi is built on open-source software including Next.js, React,
        Tailwind CSS, Base UI, Lucide, and shadcn/ui, each under its own
        license.
      </p>
    </ProseLayout>
  );
}
