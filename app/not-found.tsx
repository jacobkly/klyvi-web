import { Compass } from "lucide-react";

import { HomeLink } from "@/components/klyvi/home-link";
import { AppShell } from "@/components/shell/app-shell";

export const metadata = { title: "Page not found · Klyvi" };

/**
 * Branded 404 for any route the app does not know. It sits in the site
 * shell, so the nav and footer are still there to leave by.
 */
export default function NotFound() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
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
        <HomeLink />
      </main>
    </AppShell>
  );
}
