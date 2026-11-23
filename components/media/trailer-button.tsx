"use client";

import { ExternalLink, Play } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trailerEmbedUrl, trailerKey, trailerWatchUrl } from "@/lib/trailer";

/**
 * TMDB's official trailer, in a dialog. The player is only created once the
 * dialog opens, so nothing loads from YouTube until the button is pressed.
 * Outline, not violet: it's content, not the app speaking.
 */
export function TrailerButton({
  title,
  trailerKey: rawKey,
}: {
  title: string;
  trailerKey: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const key = trailerKey(rawKey);
  if (!key) return null;

  return (
    <>
      <Button
        variant="outline"
        size="touch"
        className="mt-4 flex w-fit sm:h-9 sm:px-3"
        onClick={() => setOpen(true)}
      >
        <Play data-icon="inline-start" aria-hidden="true" />
        Trailer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-4 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title} trailer</DialogTitle>
          </DialogHeader>
          {open ? (
            <iframe
              title={`${title} trailer`}
              src={trailerEmbedUrl(key)}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="aspect-video w-full rounded-art bg-muted"
            />
          ) : null}
          <a
            href={trailerWatchUrl(key)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Watch on YouTube
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}
