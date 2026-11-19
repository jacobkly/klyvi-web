import type * as React from "react";

import {
  NumberedSections,
  ProseLayout,
  type ProseSection,
} from "@/components/klyvi/prose-layout";

export const metadata = {
  title: "Terms of use · Klyvi",
  alternates: { canonical: "/terms" },
};

function S({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-violet-text bg-card px-4 py-3 text-sm">
      <strong>The short version:</strong> {children}
    </p>
  );
}

const SECTIONS: ProseSection[] = [
  {
    id: "what-klyvi-is",
    title: "What Klyvi is",
    body: (
      <p>
        Klyvi is a personal movie and TV tracker with recommendations, run by
        one person in Washington State, USA, not a company. It is provided free
        of charge. These terms apply whenever you use it.
      </p>
    ),
  },
  {
    id: "your-account",
    title: "Your account",
    body: (
      <p>
        You need an account to track anything. You are responsible for what
        happens under your account, so keep your sign-in details to yourself.
        You must be at least 16 years old to create an account.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <p>
        Do not attack or overload the service, scrape it wholesale, resell
        access to it, misrepresent it as your own, or use it to break the law.
        That is the whole list.
      </p>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <p>
        Your ratings, lists, and notes stay yours. Klyvi stores them to run the
        service, uses them to build your recommendations, and does not sell
        them to anyone. The <a href="/privacy">privacy policy</a> has the
        details.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability",
    body: (
      <p>
        Klyvi is free and provided as-is. It may go down, change, or lose
        features. There is no uptime guarantee and no warranty of any kind, to
        the extent the law allows.
      </p>
    ),
  },
  {
    id: "third-party-data",
    title: "Third-party data",
    body: (
      <p>
        Film and TV data comes from TMDB. Klyvi does not control it and cannot
        guarantee it is accurate or complete. Klyvi is not affiliated with or
        endorsed by TMDB. See the <a href="/attribution">attribution page</a>.
      </p>
    ),
  },
  {
    id: "ending-your-account",
    title: "Ending your account",
    body: (
      <p>
        You can delete your account at any time from Settings. The{" "}
        <a href="/privacy">privacy policy</a> explains what happens to your
        data. Klyvi can suspend or close an account for abuse or for breaking
        these terms.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        To the maximum extent the law allows, liability for damages arising
        from use of the service is excluded. Nothing here takes away rights
        that the law where you live does not let you give up.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        These terms can change, and the date at the top changes with every
        edit. A material change gets notice in the app before it takes effect.
        If you keep using Klyvi after that, you accept the new terms. If you do
        not, you can delete your account in Settings first.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the law of the State of Washington, USA.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms go to{" "}
        <a href="mailto:hello@klyvi.net">hello@klyvi.net</a>, the one address
        for everything.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <ProseLayout title="Terms of use" updated="18 November 2026">
      <S>
        Klyvi is a free tool for tracking what you watch and finding what to
        watch next. Use it reasonably, your data stays yours, and you can
        leave whenever you want.
      </S>
      <NumberedSections sections={SECTIONS} />
    </ProseLayout>
  );
}
