import type * as React from "react";

import { ProseLayout } from "@/components/klyvi/prose-layout";

export const metadata = { title: "Terms of use · Klyvi" };

function S({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-violet-text bg-card px-4 py-3 text-sm">
      <strong>The short version:</strong> {children}
    </p>
  );
}

export default function TermsPage() {
  return (
    <ProseLayout title="Terms of use" updated="4 November 2026">
      <S>
        Klyvi is a free tool for tracking what you watch and finding what to
        watch next. Use it reasonably, your data stays yours, and you can
        leave whenever you want.
      </S>

      <h2>What Klyvi is</h2>
      <p>
        Klyvi is a personal movie and TV tracker with recommendations, run by
        one person in Washington State, USA, not a company. It is provided free
        of charge. These terms apply whenever you use it.
      </p>

      <h2>Your account</h2>
      <p>
        You need an account to track anything. You are responsible for what
        happens under your account, so keep your sign-in details to yourself.
        You must be at least 16 years old to create an account.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not attack or overload the service, scrape it wholesale, resell
        access to it, misrepresent it as your own, or use it to break the law.
        That is the whole list.
      </p>

      <h2>Your content</h2>
      <p>
        Your ratings, lists, and notes stay yours. Klyvi stores them to run the
        service, uses them to build your recommendations, and does not sell
        them to anyone. The <a href="/privacy">privacy policy</a> has the
        details.
      </p>

      <h2>Availability</h2>
      <p>
        Klyvi is free and provided as-is. It may go down, change, or lose
        features. There is no uptime guarantee and no warranty of any kind, to
        the extent the law allows.
      </p>

      <h2>Third-party data</h2>
      <p>
        Film and TV data comes from TMDB. Klyvi does not control it and cannot
        guarantee it is accurate or complete. Klyvi is not affiliated with or
        endorsed by TMDB. See the <a href="/attribution">attribution page</a>.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can delete your account at any time from Settings. The{" "}
        <a href="/privacy">privacy policy</a> explains what happens to your
        data. Klyvi can suspend or close an account for abuse or for breaking
        these terms.
      </p>

      <h2>Liability</h2>
      <p>
        To the maximum extent the law allows, liability for damages arising
        from use of the service is excluded. Nothing here takes away rights
        that the law where you live does not let you give up.
      </p>

      <h2>Changes and governing law</h2>
      <p>
        These terms can change. Material changes get notice in the app. They
        are governed by the law of the State of Washington, USA.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@klyvi.net">hello@klyvi.net</a>
      </p>
    </ProseLayout>
  );
}
