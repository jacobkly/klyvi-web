import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FirstPicksPreview } from "./preview";

export const metadata = { title: "Ready · Klyvi" };

/**
 * Honest about depth: fewer than 20 ratings gets the "rough sense" line, and
 * nothing here promises personalised reasons (Tier 0/1 reality, 06-copy.md).
 */
export default async function DonePage({
  searchParams,
}: {
  searchParams: Promise<{ rated?: string }>;
}) {
  const { rated } = await searchParams;
  const count = Number(rated ?? "0");
  const full = count >= 20;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        That is enough to start
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {full
          ? "Klyvi has a sense of what you like. It gets sharper every time you rate something."
          : "Klyvi has a rough sense of what you like. Rate a few more any time and it sharpens up."}
      </p>
      <Link href="/find" className={buttonVariants({ size: "touch" }) + " mt-6"}>
        See your recommendations
      </Link>
      <FirstPicksPreview />
    </main>
  );
}
