import type * as React from "react";

import { ProseLayout } from "@/components/klyvi/prose-layout";

export const metadata = { title: "Copyright \u00b7 Klyvi" };

function S({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-violet-text bg-card px-4 py-3 text-sm">
      <strong>The short version:</strong> {children}
    </p>
  );
}
function Decide({ children }: { children: React.ReactNode }) {
  return <mark className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs text-status-paused">[{children}]</mark>;
}

export default function CopyrightPage() {
  return (
    <ProseLayout title="Copyright and takedowns" updated="30 July 2026">
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
        <Decide>CONTACT EMAIL NEEDED</Decide> with the title, the URL where it
        appears, and evidence that you hold the rights.
      </p>

      <h2>Response</h2>
      <p>
        Reports are acted on promptly, within{" "}
        <Decide>TARGET RESPONSE TIME, e.g. 7 days</Decide>.
      </p>
    </ProseLayout>
  );
}
