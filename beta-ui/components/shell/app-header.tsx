'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bookmark,
  Home,
  History,
  Menu,
  LogOut,
  Settings as SettingsIcon,
  User,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { getBrowserSupabase } from '@/lib/supabase/browser';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Library', icon: Bookmark },
];

function initialsFor(email?: string | null): string {
  if (!email) return 'K';
  const local = email.split('@')[0];
  return local.slice(0, 2).toUpperCase();
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, unavailable } = useSupabaseUser();
  const signedIn = !!user && !unavailable;

  async function signOut() {
    const sb = getBrowserSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-glass hairline-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          Klyvi
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-instant ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-2 right-2 -bottom-[1px] h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" aria-label="Open search" className="md:hidden">
            <Button size="icon" variant="ghost">
              <Search className="size-5" strokeWidth={1.5} />
            </Button>
          </Link>

          {signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 transition-transform"
                >
                  <Avatar className="size-9 hairline">
                    <AvatarFallback className="bg-card text-foreground text-sm">
                      {initialsFor(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="!normal-case !tracking-normal !text-foreground !text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium truncate">{user?.email}</span>
                    <span className="text-xs text-muted-foreground">Signed in</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/library">
                    <User className="size-4" strokeWidth={1.5} />
                    My library
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <SettingsIcon className="size-4" strokeWidth={1.5} />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/library?tab=watching">
                    <History className="size-4" strokeWidth={1.5} />
                    My activity
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut className="size-4" strokeWidth={1.5} />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href={`/signin?next=${encodeURIComponent(pathname)}`}>
                <LogIn className="size-4" strokeWidth={1.5} />
                Sign in
              </Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" strokeWidth={1.5} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Klyvi</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV.map(({ href, label, icon: Icon }) => {
                  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.5} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
