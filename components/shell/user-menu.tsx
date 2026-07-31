"use client";

import Link from "next/link";
import {
  Bell,
  FileText,
  Heart,
  LogOut,
  Settings,
  Shield,
  User,
} from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The avatar dropdown, structured per 06-copy.md §3: primary rows, then
 * Donate in its own group with the accent heart, then legal and sign out.
 * Signed out it collapses to a Sign in button; while the first session
 * check resolves it shows nothing rather than flashing the wrong state.
 */
function UserMenu() {
  const { user, loading, signOut } = useSession();

  if (loading) {
    return <div aria-hidden="true" className="size-8" />;
  }

  if (!user) {
    return (
      <Link href="/signin" className={buttonVariants({ size: "sm" })}>
        Sign in
      </Link>
    );
  }

  const initial = (
    user.email?.charAt(0) ??
    user.user_metadata?.username?.charAt(0) ??
    "K"
  ).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Your account"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initial}</AvatarFallback>
        </Avatar>
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
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/donate" />}>
          <Heart
            aria-hidden="true"
            data-icon="inline-start"
            className="text-violet-text"
          />
          Donate
        </DropdownMenuItem>
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
