import { ProseLayout } from "@/components/klyvi/prose-layout";

export const metadata = { title: "Attribution \u00b7 Klyvi" };

export default function AttributionPage() {
  return (
    <ProseLayout title="Third-party data and attribution" updated="30 July 2026">
      <h2>TMDB</h2>
      <p>
        Film and television data, posters, and images are provided by The
        Movie Database (TMDB).
      </p>
      <p>
        <strong>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </strong>
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
