'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bookmark, Home, History, Menu, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
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

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Library', icon: Bookmark },
];

export function AppHeader() {
  const pathname = usePathname();
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
                  <span aria-hidden className="absolute left-2 right-2 -bottom-[1px] h-0.5 rounded-full bg-primary" />
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

          {/* Account dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 transition-transform"
              >
                <Avatar className="size-9 hairline">
                  <AvatarFallback className="bg-card text-foreground text-sm">J</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/signin"><User className="size-4" strokeWidth={1.5} />Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings"><SettingsIcon className="size-4" strokeWidth={1.5} />Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/library?tab=watching"><History className="size-4" strokeWidth={1.5} />My activity</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/signin"><LogOut className="size-4" strokeWidth={1.5} />Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile nav sheet */}
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
                        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
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
