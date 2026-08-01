import type { ListType } from "@/lib/api/catalog";

/**
 * The browse pages behind each explore rail's View more. The slug is the
 * URL; the title matches the rail heading so the jump reads as zooming in.
 */
export type BrowseCategory = {
  slug: string;
  title: string;
  kind: "movie" | "tv";
  type: ListType;
};

export const BROWSE_CATEGORIES: Record<string, BrowseCategory> = {
  "trending-films": {
    slug: "trending-films",
    title: "Trending this week",
    kind: "movie",
    type: "trending",
  },
  "popular-films": {
    slug: "popular-films",
    title: "Popular films",
    kind: "movie",
    type: "popular",
  },
  "top-rated-films": {
    slug: "top-rated-films",
    title: "Top rated",
    kind: "movie",
    type: "top_rated",
  },
  "popular-tv": {
    slug: "popular-tv",
    title: "Popular TV",
    kind: "tv",
    type: "popular",
  },
};
