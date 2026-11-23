"use client";

import Image from "next/image";
import * as React from "react";
import { Heart } from "lucide-react";

import { ScoreInput } from "@/components/klyvi/score-input";
import { ScoreValue } from "@/components/klyvi/score-value";
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
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTvSeason } from "@/lib/api/catalog";
import { usePref } from "@/lib/local-prefs";
import { parseScoreInput, scoreHint, scoreInputText } from "@/lib/score";
import {
  STATUS_LABELS,
  type LibraryEntry,
  type TrackingStatus,
} from "@/lib/types";
import { tmdbImage } from "@/lib/tmdb-image";

const STATUS_ORDER: TrackingStatus[] = [
  "watching",
  "planning",
  "completed",
  "rewatching",
  "paused",
  "dropped",
];

/**
 * What the dialog can actually persist. Start/finish dates and rewatch
 * counts exist as columns server-side but no request accepts them yet, so
 * the form does not offer them: a field that saves nothing is a lie.
 */
export type TrackingEdit = {
  status: TrackingStatus;
  score: number | null;
  progress: number | null;
  notes: string | null;
  favorite: boolean;
};

/** Blank is null. Anything that isn't a whole number is NaN. */
function parseWhole(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  return /^-?\d+$/.test(t) ? Number(t) : NaN;
}

/** The API refuses the same limits with a 400, so this only says it sooner. */
function progressError(raw: string, total: number | null): string | null {
  const n = parseWhole(raw);
  if (n == null) return null;
  if (total != null) {
    return Number.isNaN(n) || n < 0 || n > total
      ? `Episodes must be 0 to ${total}`
      : null;
  }
  return Number.isNaN(n) || n < 0 ? "Episodes must be 0 or more" : null;
}

/** Which title the dialog is editing. The detail page rebuilds the entry
 *  object every render, so identity alone would wipe edits mid-typing. */
function entryKey(e: LibraryEntry) {
  return `${e.mediaType}:${e.tmdbId}:${e.seasonNumber ?? ""}`;
}

/**
 * The tracking edit dialog (04-components.md tier 2): field grid per the
 * AniList reference, labels and helpers verbatim from 06-copy.md, and delete
 * separated from save behind a confirm that names the title. The fields are a
 * plain form, so Enter saves. On phones it slides up from the bottom, with
 * Save always in reach under the thumb.
 */
function TrackingDialog({
  entry,
  isNew = false,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  entry: LibraryEntry;
  /** True when nothing is committed yet: there is no entry to remove, so
   *  the delete affordance would be a lie and is hidden. */
  isNew?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (edit: TrackingEdit) => void;
  onDelete: () => void;
}) {
  const isSeason = entry.mediaType === "season";
  const [scoringSystem] = usePref("scoringSystem");
  const [status, setStatus] = React.useState<TrackingStatus>(entry.status);
  // The score field holds text in the scoring system's units, not the
  // stored 0 to 100.
  const [score, setScore] = React.useState(
    scoreInputText(entry.score, scoringSystem)
  );
  const [progress, setProgress] = React.useState(
    entry.progress?.toString() ?? ""
  );
  const [notes, setNotes] = React.useState(entry.notes ?? "");
  const [favorite, setFavorite] = React.useState(entry.favorite);
  const [fetchedTotal, setFetchedTotal] = React.useState<number | null>(null);

  // Reset the form each time it opens and when a different entry opens, so
  // Cancel and close throw the draft away. Done during render, not in an
  // effect, so the old values never paint under the new title.
  const formKey = open ? entryKey(entry) : null;
  const [shownKey, setShownKey] = React.useState(formKey);
  if (shownKey !== formKey) {
    setShownKey(formKey);
    setStatus(entry.status);
    setScore(scoreInputText(entry.score, scoringSystem));
    setProgress(entry.progress?.toString() ?? "");
    setNotes(entry.notes ?? "");
    setFavorite(entry.favorite);
    setFetchedTotal(null);
  }

  // The tracking list carries no episode totals; the season detail call
  // does. Fetch lazily so "Episodes watched" gets an "of N", failing quietly
  // when offline or in mock mode.
  const total = entry.progressTotal ?? fetchedTotal;
  React.useEffect(() => {
    if (
      entry.mediaType !== "season" ||
      entry.progressTotal != null ||
      entry.tmdbId <= 0 ||
      entry.seasonNumber == null
    )
      return;
    let cancelled = false;
    getTvSeason(entry.tmdbId, entry.seasonNumber)
      .then((s) => {
        if (!cancelled && s?.episodeCount != null)
          setFetchedTotal(s.episodeCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [entry]);

  const displayTitle = isSeason
    ? `${entry.title} · Season ${entry.seasonNumber}`
    : entry.title;

  // An untouched field keeps the stored score as it is, so opening an 88 in
  // the 5-star system and saving doesn't round it to 80.
  const scoreUntouched = score === scoreInputText(entry.score, scoringSystem);
  const parsedScore = parseScoreInput(score, scoringSystem);
  const scoreProblem = scoreUntouched ? null : parsedScore.error;
  const progressProblem = isSeason ? progressError(progress, total) : null;

  function changeStatus(next: TrackingStatus) {
    setStatus(next);
    // Completed means every episode, so say so instead of leaving 7 of 10.
    if (next === "completed" && isSeason && total != null) {
      setProgress(String(total));
    }
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (scoreProblem || progressProblem) return;
    onSave({
      status,
      score: scoreUntouched ? entry.score : parsedScore.score,
      progress: isSeason ? parseWhole(progress) : null,
      notes: notes.trim() === "" ? null : notes,
      favorite,
    });
    onOpenChange(false);
  }

  const info: { label: string; value: string | number | null }[] = [
    { label: "Type", value: isSeason ? "Season" : "Film" },
    { label: "Year", value: entry.year },
    isSeason
      ? { label: "Season", value: entry.seasonNumber ?? null }
      : { label: "Runtime", value: null },
    {
      label: "Episodes",
      value: isSeason ? total : null,
    },
  ];

  return (
    // A form, so Enter in any field saves. Every other button in it is
    // type="button", so only Save submits.
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl"
      onSubmit={handleSave}
      footer={
        <div className="flex items-center justify-between gap-2 md:border-t md:border-border md:pt-4">
          {isNew ? (
            <span aria-hidden="true" className="max-md:hidden" />
          ) : (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" size="sm">
                  Remove from library
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Remove {entry.title} from your library?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Your score, progress, and notes for it will be deleted. This
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  Remove from library
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}

          <div className="flex gap-2 max-md:flex-1 max-md:justify-end">
            <Button
              variant="outline"
              className="max-md:hidden"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="max-md:flex-1">
              Save
            </Button>
          </div>
        </div>
      }
    >
      <DialogTitle className="sr-only">{displayTitle}</DialogTitle>
      <div>
        {/* Left third: what you are editing. Right two-thirds: the edit.
            Seeing the poster while scoring is the whole point, so the
            identity column is not decoration. */}
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-0">
          <aside className="sm:w-1/3 sm:shrink-0 sm:pr-6">
            <div className="flex gap-4 sm:block">
              <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 sm:w-full">
                {entry.posterPath ? (
                  <Image
                    src={tmdbImage(entry.posterPath)}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center">
                    <span className="text-xs text-muted-foreground">
                      {entry.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 sm:mt-3">
                <p className="text-[15px] leading-snug font-semibold text-foreground">
                  {entry.title}
                </p>
                {isSeason ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Season {entry.seasonNumber}
                  </p>
                ) : null}

                {entry.score != null ? (
                  <p className="mt-2 flex items-baseline gap-1.5">
                    <span
                      data-numeric
                      className="font-mono text-2xl text-violet-text"
                    >
                      <ScoreValue score={entry.score} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      your score
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Not rated yet
                  </p>
                )}

                <dl className="mt-4 hidden flex-col gap-2 sm:flex">
                  {info
                    .filter((i) => i.value != null && i.value !== "")
                    .map((i) => (
                      <div
                        key={i.label}
                        className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5 last:border-b-0"
                      >
                        <dt className="text-xs text-muted-foreground">
                          {i.label}
                        </dt>
                        <dd
                          className={
                            typeof i.value === "number"
                              ? "font-mono text-xs text-foreground"
                              : "text-xs text-foreground"
                          }
                          data-numeric={typeof i.value === "number" || undefined}
                        >
                          {i.value}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            </div>
          </aside>

          {/* The divider doubles as the column boundary. */}
          <div className="min-w-0 flex-1 sm:border-l sm:border-border sm:pl-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="td-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => changeStatus(v as TrackingStatus)}
              items={STATUS_LABELS}
            >
              <SelectTrigger id="td-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <ScoreInput
              id="td-score"
              value={score}
              onChange={setScore}
              invalid={scoreProblem != null}
              describedBy={scoreProblem ? "td-score-error" : undefined}
            />
            {scoreProblem ? (
              <p id="td-score-error" className="text-xs text-destructive">
                {scoreProblem}
              </p>
            ) : null}
          </div>

          {isSeason ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="td-progress">Episodes watched</Label>
              <Input
                id="td-progress"
                inputMode="numeric"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                aria-invalid={progressProblem ? true : undefined}
                aria-describedby={progressProblem ? "td-progress-error" : undefined}
                className="font-mono"
              />
              {progressProblem ? (
                <p id="td-progress-error" className="text-xs text-destructive">
                  {progressProblem}
                </p>
              ) : total != null ? (
                <p data-numeric className="font-mono text-xs text-muted-foreground">
                  of {total}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Started / Finished dates and a rewatch counter belong here and
              are deliberately absent: the API cannot store them yet. They
              return the day the request structs accept them. */}

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="td-notes">Notes</Label>
            <Textarea
              id="td-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Only you can see these
            </p>
          </div>

          <div className="col-span-2 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Favorite</p>
              <p className="text-xs text-muted-foreground">
                Pin it to your favorites shelf.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={favorite}
              aria-label="Favorite"
              onClick={() => setFavorite((f) => !f)}
              className={
                "hit-44 relative inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm sm:min-h-0 sm:px-3 sm:py-1.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 " +
                (favorite
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground")
              }
            >
              <Heart
                aria-hidden="true"
                strokeWidth={2}
                className={"size-4 " + (favorite ? "fill-current" : "")}
              />
              {favorite ? "Favorited" : "Favorite"}
            </button>
          </div>
        </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {scoreHint(scoringSystem)} Leave blank if you would rather not
              rate it.
            </p>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

export { TrackingDialog };
