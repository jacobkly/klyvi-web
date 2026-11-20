"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  Heart,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
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
import { cn } from "@/lib/utils";

/**
 * The avatar dropdown: who you are, the library's pages, your account, then
 * sign out. Terms and Privacy are in the footer, so they don't repeat here.
 * Signed out it collapses to a Sign in button; while the first session
 * check resolves it shows nothing rather than flashing the wrong state.
 */
function UserMenu({ asLink = false }: { asLink?: boolean }) {
  const { user, profile, loading, signOut } = useSession();
  const { unread } = useUnreadNotices();
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

  // Phones: the avatar opens the profile page, which holds the account rows.
  if (asLink) {
    return (
      <Link
        href="/profile"
        aria-label={accountLabel}
        className="hit-44 relative rounded-full outline-none transition-transform duration-(--dur-press) focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-95 motion-reduce:active:scale-100"
      >
        {face}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={accountLabel}
        className="hit-44 relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {face}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
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
          <DropdownMenuItem render={<Link href="/notifications" />}>
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
  );
}

export { UserMenu };
