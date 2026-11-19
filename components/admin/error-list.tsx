import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  ADMIN_PAGE_SIZE,
  adminHref,
  ago,
  type AdminParams,
} from "@/lib/admin";
import type { ErrorGroup, ErrorGroupPage, ErrorGroupStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ResolveButton } from "./resolve-button";

const EMPTY: Record<ErrorGroupStatus, string> = {
  open: "No open errors.",
  resolved: "Nothing resolved yet.",
  all: "No errors recorded.",
};

/** Where an error happened: source, request and status, when it had one. */
function where(g: ErrorGroup): string {
  const request = [g.method, g.route].filter(Boolean).join(" ");
  return [g.source, request, g.status ?? ""].filter(Boolean).join(" · ");
}

/**
 * The admin error list: status tabs with counts, one page of groups newest
 * first, and the open one's stack with Resolve or Reopen. Opening and paging
 * are links, so the page works as plain server HTML.
 */
export function ErrorList({
  page,
  params,
  now,
}: {
  page: ErrorGroupPage;
  params: AdminParams;
  now: number;
}) {
  const tabs: { status: ErrorGroupStatus; label: string }[] = [
    { status: "open", label: `Open ${page.counts.open}` },
    { status: "resolved", label: `Resolved ${page.counts.resolved}` },
    { status: "all", label: "All" },
  ];
  const at = (p: Partial<AdminParams>) => adminHref({ ...params, ...p });

  return (
    <div>
      <nav
        aria-label="Error status"
        className="flex gap-1 border-b border-border"
      >
        {tabs.map((t) => {
          const current = t.status === params.status;
          return (
            <Link
              key={t.status}
              href={adminHref({ status: t.status, offset: 0, openId: null })}
              aria-current={current ? "page" : undefined}
              className={cn(
                "tap-target -mb-px border-b-2 px-3 py-2 text-sm",
                current
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {page.errors.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {EMPTY[params.status]}
        </p>
      ) : (
        <ul>
          {page.errors.map((g) => {
            const open = g.id === params.openId;
            return (
              <li key={g.id} className="border-b border-border">
                <Link
                  href={at({ openId: open ? null : g.id })}
                  aria-expanded={open}
                  scroll={false}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 hover:bg-muted/40"
                >
                  <span className="truncate text-sm font-semibold">
                    {g.kind}: {g.message}
                  </span>
                  <span className="row-span-2 self-center font-mono text-sm text-muted-foreground">
                    {g.count}×
                  </span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {where(g)} · {ago(g.lastSeen, now)}
                  </span>
                </Link>
                {open && (
                  <div className="mb-3 rounded-lg bg-card p-4 ring-1 ring-border">
                    <p className="font-mono text-xs text-muted-foreground">
                      First seen {ago(g.firstSeen, now)}, last{" "}
                      {ago(g.lastSeen, now)}
                      {g.userId && `, user ${g.userId}`}
                      {g.resolvedAt && `. Resolved ${ago(g.resolvedAt, now)}`}
                    </p>
                    {g.stack && (
                      <pre className="my-3 max-h-96 overflow-auto font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-muted-foreground">
                        {g.stack}
                      </pre>
                    )}
                    <div className="mt-3">
                      <ResolveButton
                        id={g.id}
                        resolved={g.resolvedAt !== null}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(params.offset > 0 || page.hasMore) && (
        <div className="mt-6 flex justify-between">
          {params.offset > 0 ? (
            <Link
              href={at({
                offset: Math.max(0, params.offset - ADMIN_PAGE_SIZE),
                openId: null,
              })}
              className={buttonVariants({ variant: "outline", size: "touch" })}
            >
              Newer
            </Link>
          ) : (
            <span />
          )}
          {page.hasMore && (
            <Link
              href={at({
                offset: params.offset + ADMIN_PAGE_SIZE,
                openId: null,
              })}
              className={buttonVariants({ variant: "outline", size: "touch" })}
            >
              Older
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
