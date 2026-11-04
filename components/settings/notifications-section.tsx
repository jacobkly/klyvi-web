"use client";

import * as React from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { updateMe } from "@/lib/api/users";
import type { UserProfile } from "@/lib/types";

import { FieldStack, SectionHeading, SettingRow } from "./section";

type NoticeKey = "notifyPremieres" | "notifyReleases";

const SWITCHES: { key: NoticeKey; title: string; description: string }[] = [
  {
    key: "notifyPremieres",
    title: "Season premieres",
    description: "A note when something you track gets a new season.",
  },
  {
    key: "notifyReleases",
    title: "Film releases",
    description: "A note when a film on your planning list comes out.",
  },
];

export function NotificationsSection({
  me,
  onSaved,
}: {
  me: UserProfile | null;
  onSaved: (updated: UserProfile) => void;
}) {
  // What the reader last chose, over what the account has. Answers only clear a
  // choice on failure, so two quick toggles cannot flip a switch back when the
  // older reply lands last.
  const [chosen, setChosen] = React.useState<Partial<Record<NoticeKey, boolean>>>(
    {}
  );

  const toggle = (key: NoticeKey, next: boolean) => {
    setChosen((prev) => ({ ...prev, [key]: next }));
    updateMe({ [key]: next })
      .then(onSaved)
      .catch(() => {
        setChosen((prev) => {
          const rest = { ...prev };
          delete rest[key];
          return rest;
        });
        toast("Could not save that. Try again");
      });
  };

  return (
    <section>
      <SectionHeading>Notifications</SectionHeading>
      <FieldStack>
        {SWITCHES.map((s) => (
          <SettingRow key={s.key} title={s.title} description={s.description}>
            <Switch
              checked={chosen[s.key] ?? me?.[s.key] ?? true}
              disabled={!me}
              onCheckedChange={(next) => toggle(s.key, next)}
              aria-label={s.title}
            />
          </SettingRow>
        ))}

        <div>
          <p className="text-sm font-medium text-foreground">Email</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Account and security email cannot be turned off.
          </p>
        </div>
      </FieldStack>
    </section>
  );
}
