import Link from "next/link";

import { cn } from "@/lib/utils";

const COLUMNS: { heading: string; links: [string, string][] }[] = [
  {
    heading: "Product",
    links: [
      ["Find next", "/find"],
      ["Library", "/library"],
      ["Explore", "/explore"],
      ["Your stats", "/profile/stats"],
    ],
  },
  {
    heading: "Legal",
    links: [
      ["Terms of use", "/terms"],
      ["Privacy policy", "/privacy"],
      ["Copyright", "/copyright"],
      ["Attribution", "/attribution"],
    ],
  },
  {
    heading: "Support",
    links: [
      ["Donate", "/donate"],
      ["Settings", "/settings"],
    ],
  },
];

/**
 * The shared site footer: brand block plus three link columns, used by the
 * marketing page and every signed-in screen. `wide` matches the app
 * container (1400px); default matches the marketing column.
 */
export function SiteFooter({ wide = false }: { wide?: boolean }) {
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
            {COLUMNS.map((col) => (
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
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </div>
    </footer>
  );
}
