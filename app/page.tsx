import { FindNextDemo } from "@/components/marketing/find-next-demo";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarqueeHero } from "@/components/marketing/marquee-hero";
import {
  ClosingCta,
  FeaturesRow,
  StatsBand,
} from "@/components/marketing/sections";
import { SiteFooter } from "@/components/klyvi/site-footer";

export const metadata = {
  title: "Klyvi · Know what to watch right now",
  description:
    "Klyvi learns what you actually like and tells you what to watch right now, with the reason it picked it.",
};

/**
 * The marketing one-pager, phase 9 shape: marquee hero, stats band,
 * features row, the live Find Next demo, closing CTA. A server shell with
 * client islands (hero, demo); the copy sections stay static. Every
 * invented number lives in lib/marketing-claims.ts and nowhere else.
 */
export default function MarketingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNav />
      <MarqueeHero />
      <StatsBand />
      <FeaturesRow />
      <FindNextDemo />
      <ClosingCta />
      <SiteFooter />
    </div>
  );
}
