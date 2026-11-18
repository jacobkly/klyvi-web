import { FileText, Film, Tv } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { noticeHref, noticeText } from "@/lib/notification-text";
import { tmdbImage } from "@/lib/tmdb-image";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A notice: poster, title, what happened and when, opening the title's page. A
 * policy notice has no poster, shows its whole text and opens the policy page.
 */
export function NotificationRow({ notice }: { notice: AppNotification }) {
  const unread = notice.readAt === null;
  const policy = notice.kind === "policy";
  const Fallback = policy
    ? FileText
    : notice.kind === "film_release"
      ? Film
      : Tv;

  return (
    <li>
      <Link
        href={noticeHref(notice)}
        className="flex items-center gap-4 rounded-lg bg-card p-3 ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <div
          className={cn(
            "relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-art",
            !notice.posterPath && "flex items-center justify-center bg-muted/60"
          )}
        >
          {notice.posterPath ? (
            <Image
              src={tmdbImage(notice.posterPath)}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <Fallback
              aria-hidden="true"
              strokeWidth={2}
              className="size-4 text-muted-foreground/60"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm",
              policy ? "text-pretty" : "truncate",
              unread
                ? "font-medium text-foreground"
                : "font-normal text-muted-foreground"
            )}
          >
            {notice.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {noticeText(notice)}
          </p>
        </div>
        {unread ? (
          <>
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-violet-text"
            />
            <span className="sr-only">New</span>
          </>
        ) : null}
      </Link>
    </li>
  );
}
