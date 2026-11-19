"use client";

import Link from "next/link";

import { useSession } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

type Column = { heading: string; links: [string, string][] };

const LEGAL: Column = {
  heading: "Legal",
  links: [
    ["Terms of use", "/terms"],
    ["Privacy policy", "/privacy"],
    ["Copyright", "/copyright"],
    ["Attribution", "/attribution"],
  ],
};

const SIGNED_IN: Column[] = [
  {
    heading: "Product",
    links: [
      ["Find next", "/find"],
      ["Library", "/library"],
      ["Explore", "/explore"],
      ["Your stats", "/profile/stats"],
    ],
  },
  LEGAL,
  {
    heading: "Support",
    links: [
      ["Settings", "/settings"],
      ["Contact", "mailto:hello@klyvi.net"],
    ],
  },
];

/** Signed out, the app's own pages would only bounce to sign-in. */
const SIGNED_OUT: Column[] = [
  {
    heading: "Product",
    links: [
      ["Explore", "/explore"],
      ["Get started", "/signup"],
      ["Sign in", "/signin"],
    ],
  },
  LEGAL,
  { heading: "Support", links: [["Contact", "mailto:hello@klyvi.net"]] },
];

/**
 * The shared site footer: brand block plus three link columns, used by the
 * marketing page and every signed-in screen. `wide` matches the app
 * container (1400px); default matches the marketing column.
 */
export function SiteFooter({ wide = false }: { wide?: boolean }) {
  const { user } = useSession();
  const columns = user ? SIGNED_IN : SIGNED_OUT;
  return (
    <footer className="border-t border-border">
      <div
        className={cn(
          "mx-auto w-full px-4 py-10 md:px-6",
          wide ? "max-w-[1400px]" : "max-w-6xl"
        )}
      >
        <div className="flex flex-wrap justify-between gap-x-12 gap-y-8">
          <div className="max-w-xs">
            <p className="text-[15px] font-semibold tracking-tight">Klyvi</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Find what to watch right now.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-8">
            {columns.map((col) => (
              <nav
                key={col.heading}
                aria-label={col.heading}
                className="flex flex-col gap-1.5"
              >
                <p className="mb-1 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
                  {col.heading}
                </p>
                {col.links.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="tap-target inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          This website uses TMDB and the TMDB APIs but is not endorsed,
          certified, or otherwise approved by TMDB.
        </p>
      </div>
    </footer>
  );
}
