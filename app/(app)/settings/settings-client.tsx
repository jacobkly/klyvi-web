"use client";

import * as React from "react";

import { useSession } from "@/components/auth/auth-provider";
import { AccountSection } from "@/components/settings/account-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { DataSection } from "@/components/settings/data-section";
import { DeleteSection } from "@/components/settings/delete-section";
import { ListsSection } from "@/components/settings/lists-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMe } from "@/lib/api/users";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type SectionId =
  | "profile"
  | "account"
  | "appearance"
  | "lists"
  | "notifications"
  | "data"
  | "delete";

const SECTIONS: {
  group: string;
  items: { id: SectionId; label: string }[];
}[] = [
  {
    group: "Profile",
    items: [
      { id: "profile", label: "Profile" },
      { id: "account", label: "Account" },
    ],
  },
  {
    group: "Preferences",
    items: [
      { id: "appearance", label: "Appearance" },
      { id: "lists", label: "Lists" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    group: "Data",
    items: [
      { id: "data", label: "Import & export" },
      { id: "delete", label: "Delete account" },
    ],
  },
];

/**
 * Settings shell, modelled on the GitHub reference: identity block above a
 * grouped rail, active item carrying a filled row plus a 2px violet bar,
 * sections split into components/settings/*. Mobile collapses the rail to
 * horizontal scrolling tabs.
 */
export function SettingsClient() {
  const { user, setProfile } = useSession();
  const [active, setActive] = React.useState<SectionId>("profile");
  const [me, setMe] = React.useState<UserProfile | null>(null);
  const avatarSrc = me?.avatarUrl ?? null;

  React.useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => {});
  }, []);

  const onProfileSaved = React.useCallback(
    (u: UserProfile) => {
      setMe(u);
      // Push it into the session so greetings update without a reload.
      setProfile(u);
    },
    [setProfile]
  );

  const sections: Record<SectionId, React.ReactNode> = {
    profile: <ProfileSection me={me} onSaved={onProfileSaved} />,
    account: <AccountSection />,
    appearance: <AppearanceSection />,
    lists: <ListsSection />,
    notifications: <NotificationsSection />,
    data: <DataSection />,
    delete: <DeleteSection />,
  };

  const rail = (
    <nav aria-label="Settings" className="flex flex-col gap-5">
      {SECTIONS.map((s) => (
        <div key={s.group}>
          <p className="mb-1.5 px-3 text-xs text-muted-foreground">{s.group}</p>
          <div className="flex flex-col gap-0.5">
            {s.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "tap-target relative flex min-h-9 w-full items-center rounded-lg px-3 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    isActive
                      ? "bg-muted font-medium text-foreground before:absolute before:top-1.5 before:bottom-1.5 before:-left-0 before:w-0.5 before:rounded-full before:bg-violet-text"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">
      <div className="mb-8 flex items-center gap-3">
        <Avatar className="size-10">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
          <AvatarFallback>
            {(me?.username?.charAt(0) ?? "K").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {me?.username ?? "Your account"}
          </p>
          <p className="text-xs text-muted-foreground">
            {user?.email ?? "Signed in"}
          </p>
        </div>
      </div>

      {/* Mobile: rail becomes horizontal scrolling tabs. */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
        {SECTIONS.flatMap((s) => s.items).map((item) => (
          <Button
            key={item.id}
            variant={active === item.id ? "secondary" : "ghost"}
            size="sm"
            className="shrink-0"
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-10">
        <aside className="hidden w-56 shrink-0 md:block">{rail}</aside>

        <div className="min-w-0 flex-1">
          {sections[active]}
          <Separator className="mt-10 md:hidden" />
        </div>
      </div>
    </main>
  );
}
