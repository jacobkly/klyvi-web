"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Compass, House, Library, Search, Sparkles, type LucideIcon } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isActive } from "@/lib/nav";
import { modifierLabel, useIsMac } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

// Only loaded when someone opens the pop-up, so the shell stays light.
const FindClient = dynamic(
  () => import("@/app/(app)/find/find-client").then((m) => m.FindClient),
  {
    ssr: false,
    loading: () => (
      <div className="p-6">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="mt-4 h-40 w-full rounded-lg" />
      </div>
    ),
  }
);

const ITEM =
  "flex size-11 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30";
const IDLE = "text-muted-foreground hover:bg-muted hover:text-foreground";
const ON = "bg-muted text-violet-text";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
];

function Tip({ label, children }: { label: React.ReactNode; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Desktop navigation signed in: a slim pill down the left edge. Klyvi at the
 * top, the pages and search in the middle, the account at the bottom. Find
 * next is the one violet control, and it opens as a pop-up over the page
 * you are on, so asking for a pick never loses your place. Phones keep the
 * bottom tab bar.
 */
function LeftRail({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const isMac = useIsMac();
  // Tied to the page it was opened on, so following a link out of the
  // pop-up (More about it) closes it without an effect.
  const [openAt, setOpenAt] = React.useState<string | null>(null);
  const findOpen = openAt === pathname;
  const onFind = isActive(pathname, "/find");

  const link = (href: string, label: string, Icon: LucideIcon) => {
    const active = isActive(pathname, href);
    return (
      <Tip key={href} label={label}>
        <Link
          href={href}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className={cn(ITEM, active ? ON : IDLE)}
        >
          <Icon aria-hidden="true" className="size-5" />
        </Link>
      </Tip>
    );
  };

  const findClass = cn(
    ITEM,
    "bg-primary text-primary-foreground hover:bg-primary/90",
    onFind && "ring-2 ring-violet-text ring-offset-2 ring-offset-background"
  );

  return (
    <>
      <nav
        aria-label="Primary"
        data-slot="left-rail"
        className="glass fixed inset-y-3 left-3 z-40 hidden w-14 flex-col items-center justify-between rounded-full border py-3 md:flex"
      >
        <Link
          href="/home"
          aria-label="Klyvi, home"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <Image src="/icon-192.png" alt="" width={32} height={32} className="size-8 rounded-full" />
        </Link>

        <div className="flex flex-col items-center gap-2">
          {link(NAV[0].href, NAV[0].label, NAV[0].icon)}
          {link(NAV[1].href, NAV[1].label, NAV[1].icon)}
          {onFind ? (
            <Tip label="Find next">
              <Link href="/find" aria-label="Find next" aria-current="page" className={findClass}>
                <Sparkles aria-hidden="true" className="size-5" />
              </Link>
            </Tip>
          ) : (
            <Tip label="Find next">
              <button
                type="button"
                aria-label="Find next"
                aria-haspopup="dialog"
                className={findClass}
                onClick={() => setOpenAt(pathname)}
              >
                <Sparkles aria-hidden="true" className="size-5" />
              </button>
            </Tip>
          )}
          {link(NAV[2].href, NAV[2].label, NAV[2].icon)}
          <Tip
            label={
              <span className="flex items-center gap-2">
                Search
                {isMac != null ? (
                  <kbd className="font-mono text-[10px] opacity-70">
                    {modifierLabel(isMac)}
                    {isMac ? "" : " "}K
                  </kbd>
                ) : null}
              </span>
            }
          >
            <button
              type="button"
              aria-label="Search"
              className={cn(ITEM, IDLE)}
              onClick={onOpenSearch}
            >
              <Search aria-hidden="true" className="size-5" />
            </button>
          </Tip>
        </div>

        <UserMenu side="right" align="end" />
      </nav>

      <Dialog open={findOpen} onOpenChange={(o) => setOpenAt(o ? pathname : null)}>
        <DialogContent className="block max-h-[90dvh] overflow-y-auto p-0 transition-[max-width] duration-(--dur-base) sm:max-w-2xl sm:has-[[data-slot=pick-stage]]:max-w-5xl">
          <DialogTitle className="sr-only">Find next</DialogTitle>
          {findOpen ? <FindClient embedded /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { LeftRail };
