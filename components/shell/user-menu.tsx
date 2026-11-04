"use client";

import Link from "next/link";
import {
  Bell,
  FileText,
  LogOut,
  Settings,
  Shield,
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
 * The avatar dropdown: primary rows, then legal and sign out.
 * Signed out it collapses to a Sign in button; while the first session
 * check resolves it shows nothing rather than flashing the wrong state.
 */
function UserMenu() {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={unreadLabel ? `Your account, ${unreadLabel}` : "Your account"}
        className="hit-44 relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
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
          <DropdownMenuItem render={<Link href="/terms" />}>
            <FileText aria-hidden="true" data-icon="inline-start" />
            Terms
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/privacy" />}>
            <Shield aria-hidden="true" data-icon="inline-start" />
            Privacy
          </DropdownMenuItem>
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
