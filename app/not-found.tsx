import Link from "next/link";
import { Compass } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

/** Branded 404 for any route the app does not know. */
export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-24 text-center">
      <Compass
        aria-hidden="true"
        className="size-8 text-muted-foreground"
        strokeWidth={2}
      />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        This page does not exist
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The link is wrong, or the page moved. Everything worth watching is
        still where it was.
      </p>
      <Link href="/home" className={buttonVariants({ size: "touch" }) + " mt-6"}>
        Go home
      </Link>
    </main>
  );
}
