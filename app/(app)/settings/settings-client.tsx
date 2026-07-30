"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { group: "Profile", items: ["Profile", "Account"] },
  { group: "Preferences", items: ["Appearance", "Lists", "Notifications"] },
  { group: "Data", items: ["Export", "Delete account"] },
] as const;

/**
 * Settings, modelled on the GitHub reference: identity block above a grouped
 * rail, active item carrying a filled row plus a 2px violet bar, fields
 * capped at 440px with helper text under every one. Mobile collapses the
 * rail to horizontal scrolling tabs.
 */
export function SettingsClient() {
  const [active, setActive] = React.useState("Profile");
  const [confirmEmail, setConfirmEmail] = React.useState("");

  function save() {
    // PATCH /v1/users/me lands with auth.
    toast("Saved");
  }

  const rail = (
    <nav aria-label="Settings" className="flex flex-col gap-5">
      {SECTIONS.map((s) => (
        <div key={s.group}>
          <p className="mb-1.5 px-3 text-xs text-muted-foreground">{s.group}</p>
          <div className="flex flex-col gap-0.5">
            {s.items.map((item) => {
              const isActive = active === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActive(item)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "tap-target relative flex min-h-9 w-full items-center rounded-lg px-3 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    isActive
                      ? "bg-muted font-medium text-foreground before:absolute before:top-1.5 before:bottom-1.5 before:-left-0 before:w-0.5 before:rounded-full before:bg-violet-text"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {item}
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
          <AvatarFallback>K</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">Your account</p>
          <p className="text-xs text-muted-foreground">Signed in locally</p>
        </div>
      </div>

      {/* Mobile: rail becomes horizontal scrolling tabs. */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
        {SECTIONS.flatMap((s) => s.items).map((item) => (
          <Button
            key={item}
            variant={active === item ? "secondary" : "ghost"}
            size="sm"
            className="shrink-0"
            onClick={() => setActive(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="flex gap-10">
        <aside className="hidden w-56 shrink-0 md:block">{rail}</aside>

        <div className="min-w-0 flex-1">
          {active === "Profile" ? (
            <section>
              <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
              <div className="mt-6 flex max-w-[440px] flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="st-name">Display name</Label>
                  <Input id="st-name" defaultValue="" />
                  <p className="text-xs text-muted-foreground">
                    Shown on your profile. Not used anywhere else.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="st-username">Username</Label>
                  <Input id="st-username" defaultValue="" />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated on first sign-in. Change it once auth lands.
                  </p>
                </div>
                <div>
                  <Button onClick={save}>Save</Button>
                </div>
              </div>
            </section>
          ) : null}

          {active === "Account" ? (
            <section>
              <h1 className="text-xl font-semibold tracking-tight">Account</h1>
              <div className="mt-6 flex max-w-[440px] flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="st-email">Email</Label>
                  <Input id="st-email" type="email" disabled />
                  <p className="text-xs text-muted-foreground">
                    Managed through your sign-in provider.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {active === "Appearance" ? (
            <section>
              <h1 className="text-xl font-semibold tracking-tight">
                Appearance
              </h1>
              <div className="mt-6 max-w-[440px]">
                <p className="text-sm text-muted-foreground">
                  Klyvi is dark. Themes are a planned feature, and the token
                  layer underneath is already built for them.
                </p>
              </div>
            </section>
          ) : null}

          {active === "Lists" ? (
            <section>
              <h1 className="text-xl font-semibold tracking-tight">Lists</h1>
              <div className="mt-6 flex max-w-[440px] flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Combine films and TV
                    </p>
                    <p className="text-xs text-muted-foreground">
                      One library list instead of separate tabs.
                    </p>
                  </div>
                  <Switch defaultChecked aria-label="Combine films and TV" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Redo my taste
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Runs the rating deck again from scratch. Your library is
                    not touched.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => (window.location.href = "/onboarding/rate")}>
                    Redo my taste
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {active === "Notifications" ? (
            <section>
              <h1 className="text-xl font-semibold tracking-tight">
                Notifications
              </h1>
              <div className="mt-6 flex max-w-[440px] items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Season premieres
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A note when something you track gets a new season.
                  </p>
                </div>
                <Switch aria-label="Season premieres" />
              </div>
            </section>
          ) : null}

          {active === "Export" ? (
            <section>
              <h1 className="text-xl font-semibold tracking-tight">
                Export your data
              </h1>
              <div className="mt-6 max-w-[440px]">
                <p className="text-sm text-muted-foreground">
                  Everything you have tracked, as a file you can keep. Lands
                  with a coming update.
                </p>
              </div>
            </section>
          ) : null}

          {active === "Delete account" ? (
            <section>
              <h1 className="text-xl font-semibold tracking-tight">
                Delete account
              </h1>
              <div className="mt-6 max-w-[440px] rounded-lg border border-destructive/40 p-5">
                <p className="text-sm text-muted-foreground">
                  Deletes your account, your library, your ratings, and your
                  taste profile. There is no undo and no recovery period.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" className="mt-4">
                        Delete account
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your library, ratings, notes, and taste profile will be
                        permanently deleted. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="st-confirm">
                        Type your email to confirm
                      </Label>
                      <Input
                        id="st-confirm"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={confirmEmail.trim().length === 0}
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        onClick={() => toast("Account deletion arrives with auth")}
                      >
                        Delete account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </section>
          ) : null}

          <Separator className="mt-10 md:hidden" />
        </div>
      </div>
    </main>
  );
}
