"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  deleteTrackingScope,
  listTracking,
  resetScores,
} from "@/lib/api/tracking";
import { exportTracking } from "@/lib/api/users";
import { usePref, type Prefs } from "@/lib/local-prefs";
import {
  STATUS_LABELS,
  type MediaType,
  type TrackingStatus,
} from "@/lib/types";

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

/** "12 films", "1 season". */
function countOf(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * A destructive action behind a confirmation that names exactly what is
 * destroyed. `onConfirm` returns the affected-row count for the toast.
 *
 * A whole-list delete also passes `count`, read when the dialog opens so the
 * button can say how much goes ("Delete 12 films"), and `backup`, a download
 * of the list to keep before it goes.
 */
function DangerAction({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  done,
  count,
  backup,
}: {
  trigger: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<number>;
  done: (affected: number) => string;
  count?: {
    load: () => Promise<number>;
    label: (n: number) => string;
    empty: string;
  };
  backup?: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  // null while it loads, or when it could not be read. The button then
  // names the list instead of a number.
  const [n, setN] = React.useState<number | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next || !count) return;
    setN(null);
    count
      .load()
      .then(setN)
      .catch(() => setN(null));
  }

  function run() {
    setBusy(true);
    onConfirm()
      .then((affected) => {
        toast(done(affected));
        setOpen(false);
      })
      .catch(() => toast("Could not do that. Try again."))
      .finally(() => setBusy(false));
  }

  const empty = n === 0;
  const label = empty
    ? "Nothing to delete"
    : count && n != null
      ? count.label(n)
      : confirmLabel;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        className={buttonVariants({ variant: "destructive", size: "sm" })}
      >
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {empty && count ? count.empty : description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {backup && !empty ? (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                backup().catch(() =>
                  toast("Could not prepare the download. Try again.")
                )
              }
            >
              Download a copy first
            </Button>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={busy || empty}
            onClick={run}
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Redo asks first, since it starts the rating deck over, and says plainly
 * what happens to the taste Klyvi has already learned.
 */
function RedoTaste() {
  const router = useRouter();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <RotateCcw aria-hidden="true" data-icon="inline-start" />
        Redo
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Redo your taste?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll go through the rating deck again from the first card.
            Your new answers add to what Klyvi already knows from your ratings
            and library. Nothing is erased, and your library is not touched.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => router.push("/onboarding/rate?redo=1")}
          >
            Start the deck
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
          description="One library list. Turned off, the library splits into Films and TV tabs."
        >
          <Switch
            checked={combine}
            onCheckedChange={setCombine}
            aria-label="Combine films and TV"
          />
        </SettingRow>

        <SettingRow
          title="Redo my taste"
          description="Runs the rating deck again. Your library is not touched."
        >
          <RedoTaste />
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
            Which statuses show up in recent activity on home and your
            profile.
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
          Saved to your account, so every browser you sign in on matches.
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
              onConfirm={() => resetScores("movie" as MediaType)}
              done={(n) => `Cleared ${n} film ${n === 1 ? "score" : "scores"}.`}
            />
            <DangerAction
              trigger="Reset TV scores"
              title="Reset every TV score?"
              description="This clears every score on every tracked season. The entries stay. There is no undo."
              confirmLabel="Reset scores"
              onConfirm={() => resetScores("season" as MediaType)}
              done={(n) => `Cleared ${n} season ${n === 1 ? "score" : "scores"}.`}
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
              onConfirm={() => deleteTrackingScope("movie" as MediaType)}
              done={(n) => `Deleted ${n} film ${n === 1 ? "entry" : "entries"}.`}
              count={{
                load: () =>
                  listTracking({ mediaType: "movie" }).then((l) => l.length),
                label: (n) => `Delete ${countOf(n, "film", "films")}`,
                empty: "Your film list is already empty.",
              }}
              backup={() => exportTracking("csv")}
            />
            <DangerAction
              trigger="Delete TV list"
              title="Delete your entire TV list?"
              description="Every tracked season, every score, every note, gone permanently. Your account and film list stay. There is no undo."
              confirmLabel="Delete TV list"
              onConfirm={() => deleteTrackingScope("season" as MediaType)}
              done={(n) =>
                `Deleted ${n} season ${n === 1 ? "entry" : "entries"}.`
              }
              count={{
                load: () =>
                  listTracking({ mediaType: "season" }).then((l) => l.length),
                label: (n) => `Delete ${countOf(n, "season", "seasons")}`,
                empty: "Your TV list is already empty.",
              }}
              backup={() => exportTracking("csv")}
            />
          </div>
        </div>
      </FieldStack>
    </section>
  );
}
