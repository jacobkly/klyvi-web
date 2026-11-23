"use client";

import Image from "next/image";
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
 * container (1400px); default matches the marketing column. On phones the app
 * has a tab bar, so its footer drops what the tabs already reach and keeps one
 * quiet row of links over the TMDB notice.
 */
export function SiteFooter({ wide = false }: { wide?: boolean }) {
  const { user } = useSession();
  const columns = user ? SIGNED_IN : SIGNED_OUT;
  return (
    <footer className="border-t border-border">
      <div
        className={cn(
          "mx-auto w-full px-4 py-10 md:px-6",
          wide ? "max-w-[1400px] max-md:py-6" : "max-w-(--page-landing)"
        )}
      >
        <div className="flex flex-wrap justify-between gap-x-12 gap-y-8">
          <div className={cn("max-w-xs", wide && "max-md:hidden")}>
            <p className="text-[15px] font-semibold tracking-tight">Klyvi</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Find what to watch right now.
            </p>
          </div>

          <div
            className={cn(
              "flex flex-wrap gap-x-16 gap-y-8",
              wide && "max-md:gap-x-4 max-md:gap-y-1"
            )}
          >
            {columns.map((col) => (
              <nav
                key={col.heading}
                aria-label={col.heading}
                className={cn(
                  "flex flex-col gap-1.5",
                  wide &&
                    (col.heading === "Product"
                      ? "max-md:hidden"
                      : "max-md:contents")
                )}
              >
                <p
                  className={cn(
                    "mb-1 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground",
                    wide && "max-md:hidden"
                  )}
                >
                  {col.heading}
                </p>
                {col.links.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "tap-target inline-flex items-center text-sm text-muted-foreground hover:text-foreground",
                      wide && "max-md:text-xs"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4",
            wide && "max-md:mt-4 max-md:gap-1"
          )}
        >
          <a
            href="https://www.themoviedb.org"
            aria-label="TMDB"
            className="tap-target inline-flex shrink-0 items-center rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <Image
              src="/tmdb-logo.svg"
              alt=""
              width={92}
              height={12}
              unoptimized
              className="h-3 w-auto"
            />
          </a>
          <p className="text-xs text-muted-foreground">
            This website uses TMDB and the TMDB APIs but is not endorsed,
            certified, or otherwise approved by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
