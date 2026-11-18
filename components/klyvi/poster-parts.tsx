"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { Check, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * A poster image that fades in once it has loaded instead of popping in
 * half-drawn. An image already in the cache is marked loaded on mount, so it
 * never flashes. The fade is a CSS transition, so reduced motion skips it.
 */
export function FadeImage({ alt, className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const ref = React.useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <Image
      {...props}
      alt={alt}
      ref={ref}
      data-loaded={loaded ? "true" : "false"}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={cn(
        "transition-opacity duration-(--dur-slow) ease-(--ease-enter) data-[loaded=false]:opacity-0",
        className
      )}
    />
  );
}

export type PosterAction = {
  label: string;
  onSelect: () => void;
  /** The current choice, ticked in the menu (for example the status). */
  active?: boolean;
  destructive?: boolean;
  /** Starts a new group with a divider above it. */
  separated?: boolean;
};

/**
 * The quick-actions menu in a poster's top-right corner. It sits outside the
 * card's link, so opening it never navigates. Hover-only on desktop (and on
 * keyboard focus), always shown on touch where there is no hover.
 */
export function PosterActions({
  name,
  actions,
}: {
  name: string;
  actions: PosterAction[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Quick actions for ${name}`}
        className="hit-44 absolute top-1 right-1 z-10 grid size-7 place-items-center rounded-full bg-black/70 text-white outline-none backdrop-blur-sm transition-opacity duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100"
      >
        <MoreHorizontal aria-hidden="true" className="size-4" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((a) => (
          <React.Fragment key={a.label}>
            {a.separated ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              variant={a.destructive ? "destructive" : "default"}
              onClick={a.onSelect}
            >
              <span className="flex-1">{a.label}</span>
              {a.active ? (
                <Check aria-hidden="true" className="size-4 text-violet-text" strokeWidth={2} />
              ) : null}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
