"use client";

import Image from "next/image";
import * as React from "react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  STATUS_LABELS,
  posterUrl,
  type LibraryEntry,
  type TrackingStatus,
} from "@/lib/types";

const STATUS_ORDER: TrackingStatus[] = [
  "watching",
  "planning",
  "completed",
  "rewatching",
  "paused",
  "dropped",
];

export type TrackingEdit = {
  status: TrackingStatus;
  score: number | null;
  progress: number | null;
  startDate: string;
  finishDate: string;
  rewatches: number;
  notes: string;
};

/**
 * The tracking edit dialog (04-components.md tier 2): field grid per the
 * AniList reference, labels and helpers verbatim from 06-copy.md, and delete
 * separated from save behind a confirm that names the title. Forms are plain
 * inputs plus labels; `form` does not exist in this shadcn.
 */
function TrackingDialog({
  entry,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  entry: LibraryEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (edit: TrackingEdit) => void;
  onDelete: () => void;
}) {
  const isSeason = entry.mediaType === "season";
  const [status, setStatus] = React.useState<TrackingStatus>(entry.status);
  const [score, setScore] = React.useState(entry.score?.toString() ?? "");
  const [progress, setProgress] = React.useState(
    entry.progress?.toString() ?? ""
  );
  const [startDate, setStartDate] = React.useState("");
  const [finishDate, setFinishDate] = React.useState("");
  const [rewatches, setRewatches] = React.useState("0");
  const [notes, setNotes] = React.useState("");

  // Reset the form when a different entry opens.
  React.useEffect(() => {
    setStatus(entry.status);
    setScore(entry.score?.toString() ?? "");
    setProgress(entry.progress?.toString() ?? "");
  }, [entry]);

  const displayTitle = isSeason
    ? `${entry.title} · Season ${entry.seasonNumber}`
    : entry.title;

  function handleSave() {
    const parsedScore = score.trim() === "" ? null : Number(score);
    onSave({
      status,
      score:
        parsedScore == null || Number.isNaN(parsedScore)
          ? null
          : Math.min(100, Math.max(0, parsedScore)),
      progress:
        progress.trim() === "" || Number.isNaN(Number(progress))
          ? null
          : Number(progress),
      startDate,
      finishDate,
      rewatches: Number(rewatches) || 0,
      notes,
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
      value: isSeason ? entry.progressTotal : null,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{displayTitle}</DialogTitle>
        </DialogHeader>

        {/* Left third: what you are editing. Right two-thirds: the edit.
            Seeing the poster while scoring is the whole point, so the
            identity column is not decoration. */}
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-0">
          <aside className="sm:w-1/3 sm:shrink-0 sm:pr-6">
            <div className="flex gap-4 sm:block">
              <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 sm:w-full">
                {entry.posterPath ? (
                  <Image
                    src={posterUrl(entry.posterPath, "w342") as string}
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
                      {entry.score}
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
              onValueChange={(v) => setStatus(v as TrackingStatus)}
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="td-score">Score</Label>
            <Input
              id="td-score"
              inputMode="numeric"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="font-mono"
            />
          </div>

          {isSeason ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="td-progress">Episodes watched</Label>
              <Input
                id="td-progress"
                inputMode="numeric"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="font-mono"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="td-start">Started</Label>
            <Input
              id="td-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="td-finish">Finished</Label>
            <Input
              id="td-finish"
              type="date"
              value={finishDate}
              onChange={(e) => setFinishDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="td-rewatches">Rewatches</Label>
            <Input
              id="td-rewatches"
              inputMode="numeric"
              value={rewatches}
              onChange={(e) => setRewatches(e.target.value)}
              className="font-mono"
            />
          </div>

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
        </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Score is out of 100. Leave blank if you would rather not rate it.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
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

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { TrackingDialog };
