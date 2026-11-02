/**
 * Every claim the landing page makes about Klyvi lives here, and only true
 * ones go in. A number about Klyvi's usage or results needs a `source` note
 * saying where it comes from (marketing-claims.test.ts rejects any digit
 * without one). Nothing outside this file may state such a number.
 */

export const TAGLINE_CLAIM = "For people who are done scrolling";

export const STAT_CLAIMS: {
  category: string;
  value: string;
  line: string;
  /** Where a number in this claim comes from. Required once it has one. */
  source?: string;
}[] = [
  {
    category: "Price",
    value: "Free",
    line: "forever, with no paid tier",
  },
  {
    category: "Ads",
    value: "None",
    line: "and no card to sign up",
  },
  {
    category: "Your data",
    value: "Yours",
    line: "export your ratings and library any time",
  },
];

export const CLOSING_CLAIM: {
  heading: string;
  line: string;
  /** Where a number in this claim comes from. Required once it has one. */
  source?: string;
} = {
  heading: "Know what to watch tonight",
  line: "Free forever. No ads, no card, and your ratings stay yours.",
};

/** The fine print under the closing buttons. No numbers belong here. */
export const REASSURANCE_CLAIMS = [
  "Free forever",
  "No card",
  "No ads",
  "Your ratings stay yours",
];
