import { ProseLayout } from "@/components/klyvi/prose-layout";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Donate \u00b7 Klyvi" };

export default function DonatePage() {
  return (
    <ProseLayout title="Keep Klyvi running">
      <p>
        Klyvi is free, with no ads and nothing sold. Donations pay for
        hosting. Right now it runs on TMDB&apos;s free tier, and with enough
        support it can move to paid data access, which directly means better
        recommendations.
      </p>
      <p>
        <a href="#" className={buttonVariants({ size: "touch" })}>
          Donate
        </a>
      </p>
      <p>No pressure. Klyvi stays free either way.</p>
    </ProseLayout>
  );
}
