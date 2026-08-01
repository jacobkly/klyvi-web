/**
 * PLACEHOLDER shape for the Top 100 pages. No ranking exists server-side
 * yet, so every row renders the awaiting state: real structure, absent
 * data, said plainly on the page. When the ranking endpoint ships this
 * file is replaced by a fetch and the rows fill in.
 */

export type RankedTitle = {
  rank: number;
  /** Null until the ranking backend exists. */
  title: string | null;
  year: number | null;
  posterPath: string | null;
  genres: string[];
  /** 0 to 100 community score, null until ranked. */
  score: number | null;
};

export function placeholderRanking(count: number): RankedTitle[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    title: null,
    year: null,
    posterPath: null,
    genres: [],
    score: null,
  }));
}

export const TOP_100_NOTE =
  "The ranking is not computed yet. The list fills in when the backend ships it.";
