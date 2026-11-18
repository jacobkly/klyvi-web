"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useSession } from "@/components/auth/auth-provider";
import { EmptyState } from "@/components/klyvi/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import type { AppNotification } from "@/lib/types";

import { NotificationRow } from "./notification-row";
import { useUnreadNotices } from "./unread-provider";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      items: AppNotification[];
      /** Unread when the page opened. The rows keep their markers for the
       *  visit even though the server now has them as read. */
      newCount: number;
      hasMore: boolean;
    };

function offLine(premieres: boolean, releases: boolean): string | null {
  if (premieres && releases) return null;
  if (!premieres && !releases) {
    return "Season premieres and film releases are off.";
  }
  return premieres ? "Film releases are off." : "Season premieres are off.";
}

/**
 * The notice list. Opening it marks everything read and clears the dot on the
 * account menu. A failed write leaves the dot in place and the next visit tries
 * again, so there is nothing to tell the reader about it.
 */
export function NotificationsClient() {
  const { profile } = useSession();
  const { setUnread } = useUnreadNotices();
  const [state, setState] = React.useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = React.useState(0);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [moreFailed, setMoreFailed] = React.useState(false);
  // Read through a ref: setUnread changes when the session settles, and that
  // must not fetch the list a second time.
  const setUnreadRef = React.useRef(setUnread);
  React.useEffect(() => {
    setUnreadRef.current = setUnread;
  }, [setUnread]);

  React.useEffect(() => {
    const controller = new AbortController();
    getNotifications({ signal: controller.signal })
      .then((page) => {
        if (controller.signal.aborted) return;
        setState({
          kind: "ready",
          items: page.notifications,
          newCount: page.unreadCount,
          hasMore: page.hasMore,
        });
        // The menu's dot reads its count from this list on this page.
        setUnreadRef.current(page.unreadCount);
        if (page.unreadCount > 0) {
          markAllNotificationsRead()
            .then((n) => setUnreadRef.current(n))
            .catch(() => {});
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!controller.signal.aborted) setState({ kind: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  const loadMore = () => {
    if (state.kind !== "ready") return;
    setLoadingMore(true);
    setMoreFailed(false);
    getNotifications({ offset: state.items.length })
      .then((page) => {
        setState((prev) =>
          prev.kind === "ready"
            ? {
                ...prev,
                items: [...prev.items, ...page.notifications],
                hasMore: page.hasMore,
              }
            : prev
        );
      })
      .catch(() => setMoreFailed(true))
      .finally(() => setLoadingMore(false));
  };

  const off = profile
    ? offLine(profile.notifyPremieres, profile.notifyReleases)
    : null;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
      {state.kind === "ready" && state.newCount > 0 ? (
        <p data-numeric className="mt-1 font-mono text-xs text-muted-foreground">
          {state.newCount} new
        </p>
      ) : null}
      {off ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {off} You can change that in{" "}
          <Link
            href="/settings"
            className="text-foreground underline underline-offset-4"
          >
            Settings
          </Link>
          .
        </p>
      ) : null}

      {state.kind === "loading" ? (
        <ol aria-label="Loading notifications" className="mt-6 flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-[96px] rounded-lg" />
            </li>
          ))}
        </ol>
      ) : null}

      {state.kind === "error" ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="text-[15px] font-semibold text-foreground">
            Could not load your notifications.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong on Klyvi&apos;s end.
          </p>
          <Button className="mt-5" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}

      {state.kind === "ready" && state.items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={Bell}
            title="Nothing yet"
            body="Season premieres and updates for what you track will show up here."
          />
        </div>
      ) : null}

      {state.kind === "ready" && state.items.length > 0 ? (
        <>
          <ul className="mt-6 flex flex-col gap-2">
            {state.items.map((notice) => (
              <NotificationRow key={notice.id} notice={notice} />
            ))}
          </ul>
          {state.hasMore ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              {moreFailed ? (
                <p className="text-sm text-muted-foreground">
                  Could not load more.
                </p>
              ) : null}
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {moreFailed ? "Try again" : "Show more"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
