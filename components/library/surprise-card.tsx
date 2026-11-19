"use client";

import Image from "next/image";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { mediaHref } from "@/lib/media-href";
import { tmdbImage } from "@/lib/tmdb-image";
import type { LibraryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Surprise me's answer: one title you meant to watch, with the two things
 * you'd do next. Opening it, or starting it when it's still planned. Editing
 * stays behind the pencil, where it was.
 */
export function SurpriseCard({
  entry,
  onClose,
  onStart,
  onAnother,
}: {
  entry: LibraryEntry;
  onClose: () => void;
  onStart: () => void;
  /** Another pick, when there is more than one to choose from. */
  onAnother?: () => void;
}) {
  const planned = entry.status === "planning";
  const href = mediaHref(entry);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex gap-4">
          <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
            {entry.posterPath ? (
              <Image
                src={tmdbImage(entry.posterPath)}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 pt-1 pr-8">
            <DialogDescription className="text-xs text-muted-foreground">
              {planned ? "From your Planning list" : "From what you're watching"}
            </DialogDescription>
            <DialogTitle className="mt-1 text-lg leading-snug font-semibold text-foreground">
              {entry.title}
            </DialogTitle>
            <p data-numeric className="mt-1 font-mono text-xs text-muted-foreground">
              {entry.seasonNumber != null ? `Season ${entry.seasonNumber}` : null}
              {entry.seasonNumber != null && entry.year != null ? " · " : null}
              {entry.year ?? null}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {planned ? (
            <Button size="touch" className="flex-1" onClick={onStart}>
              Start watching
            </Button>
          ) : null}
          <Link
            href={href}
            className={cn(
              buttonVariants({ size: "touch", variant: planned ? "outline" : "default" }),
              "flex-1"
            )}
          >
            Open
          </Link>
        </div>
        {onAnother ? (
          <Button variant="ghost" size="touch" onClick={onAnother}>
            Pick another
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
