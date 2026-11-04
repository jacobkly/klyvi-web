import type { Metadata } from "next";

export const SITE_URL = "https://klyvi.net";

/**
 * What every page starts from. The share image comes from
 * app/opengraph-image.png. There is deliberately no openGraph or twitter
 * title here: pages only set `title`, and Next fills the share title from it
 * unless a parent sets one, which would make every shared film say "Klyvi".
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Klyvi",
  description:
    "A personalized movie and TV discovery app that learns your taste and helps you find what to watch next.",
  openGraph: { type: "website", siteName: "Klyvi" },
  twitter: { card: "summary_large_image" },
};
