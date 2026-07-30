import type * as React from "react";

import { ProseLayout } from "@/components/klyvi/prose-layout";

export const metadata = { title: "Privacy policy \u00b7 Klyvi" };

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

export default function PrivacyPage() {
  return (
    <ProseLayout title="Privacy policy" updated="30 July 2026">
      <S>
        Klyvi stores your email, what you watch, and how you rate it. That is
        what makes recommendations work. It is not sold and not shared for
        advertising.
      </S>

      <h2>What is collected</h2>
      <ul>
        <li>Your email address and sign-in identity, handled by Supabase.</li>
        <li>Your tracking entries, ratings, favorites, and interactions.</li>
        <li>Basic technical logs (requests, errors) needed to run the service.</li>
      </ul>

      <h2>What is not collected</h2>
      <p>
        No advertising identifiers, no cross-site tracking, no data brokers,
        and nothing is sold to anyone. There are no third-party ad or
        analytics scripts on Klyvi. <Decide>CONFIRM IF ANALYTICS EVER ADDED</Decide>
      </p>

      <h2>Why it is collected</h2>
      <p>
        Your ratings are the recommender&apos;s only input. Without them the
        product does not function. Nothing is collected beyond what the
        features you use require.
      </p>

      <h2>Cookies</h2>
      <p>
        One session cookie keeps you signed in. There are no advertising or
        analytics cookies, which is why there is no cookie banner.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li><strong>Supabase</strong>: authentication and data storage.</li>
        <li><strong><Decide>HOSTING PROVIDER</Decide></strong>: serves the app.</li>
        <li>
          <strong>TMDB</strong>: provides catalog data. TMDB receives film and
          show lookups, never your identity.
        </li>
      </ul>

      <h2>How long it is kept</h2>
      <p>
        While your account exists. Deleting your account deletes your data.
      </p>

      <h2>Your rights</h2>
      <p>
        Access, export, correction, and deletion. Deletion works today from
        Settings. <Decide>EXPORT: CONFIRM AVAILABLE</Decide>
      </p>

      <h2>Children</h2>
      <p>
        Klyvi is not intended for users under{" "}
        <Decide>13 OR 16, DEPENDS ON JURISDICTION</Decide>.
      </p>

      <h2>Changes and contact</h2>
      <p>
        Material changes get notice in the app. Questions:{" "}
        <Decide>CONTACT EMAIL NEEDED</Decide>
      </p>
    </ProseLayout>
  );
}
