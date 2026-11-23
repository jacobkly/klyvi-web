"use client";

import Link from "next/link";
import * as React from "react";
import {
  BarChart3,
  Bell,
  Heart,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { NotificationsClient } from "@/components/notifications/notifications-client";
import { useUnreadNotices } from "@/components/notifications/unread-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * The avatar dropdown: who you are, the library's pages, your account, then
 * sign out. Terms and Privacy are in the footer, so they don't repeat here.
 * Notifications opens in place: the menu closes and a pop-up takes its spot.
 * Signed out it collapses to a Sign in button; while the first session
 * check resolves it shows nothing rather than flashing the wrong state.
 */
function UserMenu({
  side = "bottom",
  align = "end",
}: {
  side?: "bottom" | "right";
  align?: "start" | "end";
} = {}) {
  const { user, profile, loading, signOut } = useSession();
  const { unread } = useUnreadNotices();
  const [noticesOpen, setNoticesOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const avatarSrc = profile?.avatarUrl ?? null;

  if (loading) {
    return <div aria-hidden="true" className="size-8" />;
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className={cn(buttonVariants({ size: "sm" }), "hit-44 relative")}
      >
        Sign in
      </Link>
    );
  }

  // The chosen username wins over the email: it is what the app greets by.
  const initial = (
    profile?.username?.charAt(0) ??
    user.email?.charAt(0) ??
    "K"
  ).toUpperCase();

  const unreadLabel =
    unread > 0
      ? `${unread} unread notification${unread === 1 ? "" : "s"}`
      : null;

  const face = (
    <>
      <Avatar className="size-8">
        {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
        <AvatarFallback className="text-xs">{initial}</AvatarFallback>
      </Avatar>
      {unreadLabel ? (
        <span
          aria-hidden="true"
          data-slot="unread-dot"
          className="absolute top-0 right-0 size-2 rounded-full bg-violet-text ring-2 ring-background"
        />
      ) : null}
    </>
  );
  const accountLabel = unreadLabel ? `Your account, ${unreadLabel}` : "Your account";

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        ref={triggerRef}
        aria-label={accountLabel}
        className="hit-44 relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {face}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="min-w-60">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
            <AvatarFallback className="text-xs">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {profile?.username ? (
              <p className="truncate text-sm font-medium text-foreground">
                {profile.username}
              </p>
            ) : null}
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/library/favorites" />}>
            <Heart aria-hidden="true" data-icon="inline-start" />
            Favorites
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/profile/stats" />}>
            <BarChart3 aria-hidden="true" data-icon="inline-start" />
            Stats
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/profile" />}>
            <User aria-hidden="true" data-icon="inline-start" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings aria-hidden="true" data-icon="inline-start" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNoticesOpen(true)}>
            <Bell aria-hidden="true" data-icon="inline-start" />
            Notifications
            {unreadLabel ? (
              <>
                <span
                  aria-hidden="true"
                  data-slot="unread-dot"
                  className="ml-auto size-2 rounded-full bg-violet-text"
                />
                <span className="sr-only">{unreadLabel}</span>
              </>
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void signOut()}>
            <LogOut aria-hidden="true" data-icon="inline-start" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
    <Popover open={noticesOpen} onOpenChange={setNoticesOpen}>
      <PopoverContent
        anchor={triggerRef}
        side={side}
        align={align}
        sideOffset={12}
        className="max-h-[min(32rem,var(--available-height))] w-96 gap-0 overflow-y-auto overscroll-contain"
        // Following a notice, or the link to Settings, is done with the pop-up.
        onClick={(event) => {
          if ((event.target as Element).closest("a")) setNoticesOpen(false);
        }}
      >
        <NotificationsClient compact />
      </PopoverContent>
    </Popover>
    </>
  );
}

export { UserMenu };
