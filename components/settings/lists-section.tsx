"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePref, type Prefs } from "@/lib/local-prefs";
import { STATUS_LABELS, type TrackingStatus } from "@/lib/types";

import { FieldStack, SectionHeading, SettingRow, SettingsNote } from "./section";

const SCORING: Record<Prefs["scoringSystem"], string> = {
  hundred: "100 point",
  ten: "10 point",
  stars: "5 star",
  smiley: "3 smiley",
};

const ORDERS: Record<Prefs["listOrder"], string> = {
  updated: "Last updated",
  title: "Title",
  score: "Score",
  added: "Last added",
};

/** Feed verbs per status, Klyvi's vocabulary rather than AniList's. */
const ACTIVITY: { status: TrackingStatus; label: string }[] = [
  { status: "watching", label: "Watching activity" },
  { status: "planning", label: "Planning activity" },
  { status: "completed", label: "Completed activity" },
  { status: "rewatching", label: "Rewatching activity" },
  { status: "paused", label: "Paused activity" },
  { status: "dropped", label: "Dropped activity" },
];

/**
 * A destructive action behind a confirmation that names exactly what is
 * destroyed. No backend exists for these yet, so confirm closes with the
 * honest not-built toast; the shape is real so wiring is a swap later.
 */
function DangerAction({
  trigger,
  title,
  description,
  confirmLabel,
}: {
  trigger: string;
  title: string;
  description: string;
  confirmLabel: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        className={buttonVariants({ variant: "destructive", size: "sm" })}
      >
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={() =>
              toast("Not wired up yet. Arrives with a coming update.")
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ListsSection() {
  const [scoring, setScoring] = usePref("scoringSystem");
  const [order, setOrder] = usePref("listOrder");
  const [combine, setCombine] = usePref("combineLists");
  const [feed, setFeed] = usePref("activityFeed");

  return (
    <section>
      <SectionHeading>Lists</SectionHeading>
      <FieldStack>
        <SettingRow
          title="Combine films and TV"
          description="One library list instead of separate tabs."
        >
          <Switch
            checked={combine}
            onCheckedChange={setCombine}
            aria-label="Combine films and TV"
          />
        </SettingRow>

        <SettingRow
          title="Redo my taste"
          description="Runs the rating deck again from scratch. Your library is not touched."
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => (window.location.href = "/onboarding/rate")}
          >
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
            Redo
          </Button>
        </SettingRow>

        <SettingRow
          title="Scoring system"
          description="Display only. Scores store as 0 to 100 underneath."
        >
          <Select
            value={scoring}
            onValueChange={(v) =>
              setScoring((v ?? "hundred") as Prefs["scoringSystem"])
            }
            items={SCORING}
          >
            <SelectTrigger aria-label="Scoring system" className="min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SCORING).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          title="Default list order"
          description="How the library sorts before you touch it."
        >
          <Select
            value={order}
            onValueChange={(v) =>
              setOrder((v ?? "updated") as Prefs["listOrder"])
            }
            items={ORDERS}
          >
            <SelectTrigger aria-label="Default list order" className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDERS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <div>
          <p className="text-sm font-medium text-foreground">
            List activity creation
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Which list updates create an entry on your activity feed.
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            {ACTIVITY.map((a) => {
              const checked = feed[a.status] ?? true;
              return (
                <Label
                  key={a.status}
                  className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                >
                  {/* The wrapping Label names it; an aria-label on top
                      would double the accessible name. */}
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) =>
                      setFeed({ ...feed, [a.status]: next === true })
                    }
                  />
                  {a.label}
                </Label>
              );
            })}
          </div>
        </div>

        <SettingsNote>
          Saved on this device. List preferences sync when the settings
          endpoints ship.
        </SettingsNote>

        <div className="rounded-lg border border-destructive/40 p-5">
          <p className="text-sm font-medium text-destructive">
            Reset list scores
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Clears scores and keeps the entries.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <DangerAction
              trigger="Reset film scores"
              title="Reset every film score?"
              description={`This clears every score on every film entry (${STATUS_LABELS.completed}, ${STATUS_LABELS.watching}, all of them). The entries stay. There is no undo.`}
              confirmLabel="Reset scores"
            />
            <DangerAction
              trigger="Reset TV scores"
              title="Reset every TV score?"
              description="This clears every score on every tracked season. The entries stay. There is no undo."
              confirmLabel="Reset scores"
            />
          </div>

          <p className="mt-6 text-sm font-medium text-destructive">
            Delete list
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Removes every entry, score, and note. This is the big one.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <DangerAction
              trigger="Delete film list"
              title="Delete your entire film list?"
              description="Every tracked film, every score, every note, gone permanently. Your account and TV list stay. There is no undo."
              confirmLabel="Delete film list"
            />
            <DangerAction
              trigger="Delete TV list"
              title="Delete your entire TV list?"
              description="Every tracked season, every score, every note, gone permanently. Your account and film list stay. There is no undo."
              confirmLabel="Delete TV list"
            />
          </div>
        </div>
      </FieldStack>
    </section>
  );
}
