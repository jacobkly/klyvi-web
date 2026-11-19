import type * as React from "react";

import {
  NumberedSections,
  ProseLayout,
  type ProseSection,
} from "@/components/klyvi/prose-layout";

export const metadata = {
  title: "Privacy policy · Klyvi",
  alternates: { canonical: "/privacy" },
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
    id: "who-runs-klyvi",
    title: "Who runs Klyvi",
    body: (
      <p>
        Klyvi is run by one person in Washington State, USA, not a company.
        That person decides how your data is used and answers at{" "}
        <a href="mailto:hello@klyvi.net">hello@klyvi.net</a>.
      </p>
    ),
  },
  {
    id: "what-is-collected",
    title: "What is collected",
    body: (
      <ul>
        <li>
          Your email address and sign-in details, handled by Supabase. If you
          use a password, only a hash of it is stored.
        </li>
        <li>
          Your profile, as far as you fill it in: username, photo, bio,
          birthday, and favorites.
        </li>
        <li>Your tracking entries, scores, and notes.</li>
        <li>
          What Klyvi shows you and what you do with it, such as the titles you
          open or dismiss, plus the taste profile built from all of this.
        </li>
        <li>Your settings, including your notification switches.</li>
        <li>Technical logs, described below.</li>
      </ul>
    ),
  },
  {
    id: "what-is-not-collected",
    title: "What is not collected",
    body: (
      <p>
        No advertising identifiers, no cross-site tracking, no data brokers,
        and nothing is sold to anyone. There are no third-party ad or
        analytics scripts on Klyvi.
      </p>
    ),
  },
  {
    id: "legal-basis",
    title: "Why it is collected, and the legal basis",
    body: (
      <>
        <p>
          Your tracking, scores, and interactions are what your recommendations
          are built from. Nothing is collected beyond what the features you use
          require. Where a privacy law such as the GDPR asks for a legal basis,
          these are the ones Klyvi relies on:
        </p>
        <ul>
          <li>
            <strong>Providing the service you asked for:</strong> your account,
            library, recommendations, notices, and account email.
          </li>
          <li>
            <strong>Legitimate interests:</strong> logs and rate limits, which
            keep Klyvi running and secure.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>
          Klyvi sets sign-in cookies that keep you signed in. There are no
          advertising or analytics cookies, which is why there is no cookie
          banner.
        </p>
        <p>
          It also uses your browser&apos;s local storage to remember your
          display and list preferences, whether you dismissed a prompt on the
          home page, and your place in the onboarding ratings.
        </p>
      </>
    ),
  },
  {
    id: "logs",
    title: "Logs",
    body: (
      <>
        <p>
          Each request to Klyvi&apos;s API writes a log line with your IP
          address, your browser&apos;s user agent, the time, and the address
          requested, which can include your search terms. Logs are used to keep
          the service running and to spot abuse. IP addresses are also held in
          memory for a short time to enforce rate limits.
        </p>
        <p>
          Logs are capped at 30 MB and new lines overwrite the oldest, so how
          long a line lasts depends on how busy Klyvi is. The whole log is
          cleared whenever a new version goes live. Deleting your account does
          not remove log lines, they age out the same way.
        </p>
      </>
    ),
  },
  {
    id: "imports",
    title: "Imports",
    body: (
      <p>
        When you import your history, the file is read to match titles against
        the catalog and is not kept. Klyvi keeps the result: matched titles
        become entries in your library, and the import record holds the counts
        and the titles it could not match.
      </p>
    ),
  },
  {
    id: "profile-photo",
    title: "Your profile photo",
    body: (
      <p>
        Your photo is shrunk in your browser, then re-encoded on the server,
        which removes location data and anything else embedded in the file. It
        is stored where anyone with the link can view it, so do not use a photo
        you want kept private. Removing it in Settings deletes the file.
      </p>
    ),
  },
  {
    id: "notices-and-email",
    title: "Notices and email",
    body: (
      <>
        <p>
          Klyvi creates notices in the app about what you track, such as a new
          season or a film coming out. You can turn each kind off in Settings.
          Read notices are deleted after 90 days, and all notices after 170
          days.
        </p>
        <p>
          Before a material change to this policy or the terms, every account
          gets a notice in the app. That kind cannot be turned off.
        </p>
        <p>
          Klyvi only sends email about your account and its security, such as
          confirming your address or resetting your password. That email cannot
          be turned off.
        </p>
      </>
    ),
  },
  {
    id: "who-receives-your-data",
    title: "Who receives your data",
    body: (
      <>
        <ul>
          <li>
            <strong>Supabase</strong>: sign-in, the database, and profile
            photos. It holds your account data.
          </li>
          <li>
            <strong>Vercel</strong>: serves the website, so it handles your IP
            address, the pages you ask for, and your sign-in cookies.
          </li>
          <li>
            <strong>Cloudflare</strong>: runs Klyvi&apos;s domain and the
            connection to the API, so it handles your IP address and what you
            send to the API, including what you search for and track.
          </li>
          <li>
            <strong>Resend</strong>: delivers account and security email, so it
            receives your email address and the message.
          </li>
          <li>
            <strong>Google and Microsoft</strong>: only if you sign in with
            them. They learn that you signed in to Klyvi and pass along your
            email address.
          </li>
          <li>
            <strong>TMDB</strong>: provides film and TV data. Posters and stills
            load directly from TMDB&apos;s image servers, so those servers see
            your IP address and which images you load. Klyvi&apos;s own
            requests to TMDB carry nothing that identifies you.
          </li>
          <li>
            <strong>YouTube</strong>: plays trailers. Its player loads only when
            you press play on a trailer, and then YouTube sees your IP address
            and which trailer you watch. Klyvi uses YouTube&apos;s no-cookie
            player.
          </li>
          <li>
            <strong>The API server</strong>: a server run by the person behind
            Klyvi. It runs the app and writes the logs.
          </li>
        </ul>
        <p>Nobody else receives your data, and none of it is sold.</p>
      </>
    ),
  },
  {
    id: "where-it-is-stored",
    title: "Where your data is stored",
    body: (
      <p>
        Your data is stored in the United States. If you use Klyvi from another
        country, it travels there. Vercel and Cloudflare run worldwide
        networks, so a request can pass through a server closer to you on the
        way.
      </p>
    ),
  },
  {
    id: "how-long-it-is-kept",
    title: "How long it is kept",
    body: (
      <>
        <p>
          Your account data is kept while your account exists. Deleting your
          account removes your library, scores, interactions, taste profile,
          notices, import records, photo, and sign-in record from the database
          at once. No other copy is kept.
        </p>
        <p>
          The only thing left afterwards is log lines, which are capped at 30
          MB and roll over as described under Logs.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you can ask to access, correct, delete,
          or receive a copy of your data, and object to or restrict how it is
          used. Here is how:
        </p>
        <ul>
          <li>
            <strong>Get a copy:</strong> Download JSON, in Settings under
            Import and export, gives you one file with your account, library,
            ratings, interactions, notices, import results (titles that
            didn&apos;t match included), and taste profile. Your library is
            also available as CSV.
          </li>
          <li>
            <strong>Correct:</strong> edit your profile in Settings and your
            entries in your library.
          </li>
          <li>
            <strong>Delete:</strong> Delete account, in Settings. There is no
            undo.
          </li>
          <li>
            <strong>Anything else:</strong> email{" "}
            <a href="mailto:hello@klyvi.net">hello@klyvi.net</a>. You will get
            an answer within 30 days.
          </li>
        </ul>
        <p>
          You also have the right to complain to the data protection regulator
          where you live.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Klyvi is not for anyone under 16. If you think someone under 16 has an
        account, email <a href="mailto:hello@klyvi.net">hello@klyvi.net</a> and
        it will be deleted.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        This policy can change, and the date at the top changes with every
        edit. A material change gets notice in the app before it takes effect.
        If you keep using Klyvi after that, you accept the new version. If you
        do not, you can delete your account in Settings first.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about this policy or your data go to{" "}
        <a href="mailto:hello@klyvi.net">hello@klyvi.net</a>, the one address
        for everything.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <ProseLayout title="Privacy policy" updated="18 November 2026">
      <S>
        Klyvi stores your email, what you watch, and how you rate it. That is
        what makes recommendations work. It is not sold and not shared for
        advertising.
      </S>
      <NumberedSections sections={SECTIONS} />
    </ProseLayout>
  );
}
