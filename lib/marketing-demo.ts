import { mockFeed } from "./mock-reco";
import type { Reason, Scored } from "./types";

/**
 * The five films behind the landing page's live Find Next demo. Artwork,
 * synopses, and runtimes are the real mock-reco films (real TMDB paths);
 * the reasons are curated to read like a formed taste profile, since that
 * is the product moment the demo exists to show.
 */

const DEMO_REASONS: Reason[][] = [
  [
    { kind: "keyword", id: 9826, name: "social thriller" },
    { kind: "keyword", id: 1, name: "because you liked Parasite" },
    { kind: "keyword", id: 14602, name: "class differences" },
  ],
  [
    { kind: "keyword", id: 12565, name: "psychological thriller" },
    { kind: "keyword", id: 470, name: "revenge" },
    { kind: "keyword", id: 2, name: "because you rate slow burns highly" },
  ],
  [
    { kind: "keyword", id: 13141, name: "whodunit" },
    { kind: "keyword", id: 3, name: "because you liked Memories of Murder" },
    { kind: "genre", id: 9648, name: "Mystery" },
  ],
  [
    { kind: "keyword", id: 128, name: "con artist" },
    { kind: "keyword", id: 549, name: "period drama" },
    { kind: "keyword", id: 4, name: "because you liked Oldboy" },
  ],
  [
    { kind: "keyword", id: 471, name: "vigilante" },
    { kind: "keyword", id: 5, name: "because you rate crime epics highly" },
  ],
];

export const DEMO_PICKS: Scored[] = mockFeed(1, 5).map((pick, i) => ({
  ...pick,
  reasons: DEMO_REASONS[i] ?? pick.reasons,
}));

/** Start in the middle so both neighbours peek in from the first frame. */
export const DEMO_START_INDEX = 2;
