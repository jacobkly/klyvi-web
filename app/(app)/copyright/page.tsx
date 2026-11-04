import type * as React from "react";

import { ProseLayout } from "@/components/klyvi/prose-layout";

export const metadata = { title: "Copyright · Klyvi" };

function S({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-violet-text bg-card px-4 py-3 text-sm">
      <strong>The short version:</strong> {children}
    </p>
  );
}

export default function CopyrightPage() {
  return (
    <ProseLayout title="Copyright and takedowns" updated="4 November 2026">
      <S>
        The posters and images on Klyvi belong to their rights holders and are
        shown to identify titles. If something of yours should not be here,
        say so and it comes down.
      </S>

      <h2>What is shown</h2>
      <p>
        Posters, backdrops, and stills come from TMDB and belong to their
        respective rights holders. Klyvi displays them solely to identify the
        films and shows in its catalog.
      </p>

      <h2>Your content</h2>
      <p>Your ratings and notes are yours.</p>

      <h2>Reporting</h2>
      <p>
        If you hold rights to something shown here and want it removed, email{" "}
        <a href="mailto:hello@klyvi.net">hello@klyvi.net</a> with the title,
        the URL where it appears, and evidence that you hold the rights. The
        same goes for a profile photo that uses your work.
      </p>

      <h2>Response</h2>
      <p>Reports are acted on within 7 days.</p>
    </ProseLayout>
  );
}
