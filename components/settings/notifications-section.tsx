"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePref } from "@/lib/local-prefs";

import { FieldStack, SectionHeading, SettingRow, SettingsNote } from "./section";

/**
 * Only what Klyvi can honestly promise today or near-term. No social, no
 * forum, so none of that vocabulary appears here.
 */
const IN_APP: { id: string; title: string; description: string; on: boolean }[] =
  [
    {
      id: "premieres",
      title: "Season premieres",
      description: "A note when something you track gets a new season.",
      on: true,
    },
    {
      id: "releases",
      title: "Planned releases",
      description: "A film on your planning list becomes available.",
      on: true,
    },
    {
      id: "catalog",
      title: "Catalog changes",
      description:
        "Something you track changes or disappears in the catalog.",
      on: false,
    },
  ];

const EMAILS: { id: string; label: string; description: string }[] = [
  {
    id: "digest",
    label: "Weekly digest",
    description:
      "One email a week. What changed in your library, what to watch next.",
  },
  {
    id: "news",
    label: "Product news",
    description: "Occasional notes when Klyvi gains something real.",
  },
];

export function NotificationsSection() {
  const [notifications, setNotifications] = usePref("notifications");
  const [emails, setEmails] = usePref("emails");

  return (
    <section>
      <SectionHeading>Notifications</SectionHeading>
      <FieldStack>
        {IN_APP.map((n) => (
          <SettingRow key={n.id} title={n.title} description={n.description}>
            <Switch
              checked={notifications[n.id] ?? n.on}
              onCheckedChange={(next) =>
                setNotifications({ ...notifications, [n.id]: next })
              }
              aria-label={n.title}
            />
          </SettingRow>
        ))}

        <div>
          <p className="text-sm font-medium text-foreground">Email</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Off unless you turn it on. Unsubscribe works from every email.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {EMAILS.map((e) => (
              <Label
                key={e.id}
                className="flex cursor-pointer items-start gap-3"
              >
                <Checkbox
                  checked={emails[e.id] ?? false}
                  onCheckedChange={(next) =>
                    setEmails({ ...emails, [e.id]: next === true })
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm text-foreground">
                    {e.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {e.description}
                  </span>
                </span>
              </Label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Account and security email cannot be turned off.
          </p>
        </div>

        <SettingsNote>
          Saved on this device. Delivery starts when notifications ship.
        </SettingsNote>
      </FieldStack>
    </section>
  );
}
