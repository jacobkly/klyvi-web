"use client";

import * as React from "react";
import { FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ImportSource } from "@/lib/api/imports";
import type { ImportJob } from "@/lib/types";
import { useImportJob } from "@/lib/use-import-job";

import { ImportProgress } from "./import-progress";

const SOURCES: Record<string, string> = {
  letterboxd: "Letterboxd",
  trakt: "Trakt",
  csv: "A CSV file",
};

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The whole import interaction, minus its surrounding chrome: pick the source,
 * drop the export, watch the progress bar, start it. Shared by the settings
 * dialog and the onboarding step so the flow (and its polling) lives in one
 * place. The owner reacts to completion via onDone / onFailed (a toast, a
 * redirect); everything else, including the live bar, is handled here.
 */
export function ImportFlow({
  onDone,
  onFailed,
}: {
  onDone?: (job: ImportJob) => void;
  onFailed?: (job: ImportJob) => void;
}) {
  const [source, setSource] = React.useState("letterboxd");
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { job, running, startFailed, start } = useImportJob();

  // Fire the owner's callback once, when the job first reaches a terminal state.
  const settledRef = React.useRef(false);
  React.useEffect(() => {
    if (!job || settledRef.current) return;
    if (job.status === "done") {
      settledRef.current = true;
      onDone?.(job);
    } else if (job.status === "failed") {
      settledRef.current = true;
      onFailed?.(job);
    }
  }, [job, onDone, onFailed]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">Where is it from?</p>
        <Select
          value={source}
          onValueChange={(v) => setSource(v ?? "letterboxd")}
          items={SOURCES}
        >
          <SelectTrigger aria-label="Import source" className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SOURCES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) setFile(dropped);
        }}
        className={
          "flex flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 " +
          (dragOver
            ? "border-violet-text/60 bg-muted/60"
            : "border-border bg-card/50 hover:bg-muted/40")
        }
      >
        <FileUp
          aria-hidden="true"
          className="size-5 text-muted-foreground"
          strokeWidth={2}
        />
        {file ? (
          <>
            <p className="mt-3 text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p
              data-numeric
              className="mt-1 font-mono text-xs text-muted-foreground"
            >
              {prettySize(file.size)}
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-foreground">
              Drop the export here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Or click to browse. CSV or ZIP works.
            </p>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.zip,.json"
        aria-label="Choose an export file"
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) setFile(picked);
          e.target.value = "";
        }}
      />

      {job || startFailed ? (
        <ImportProgress job={job} startFailed={startFailed} />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Matched titles land as completed entries.
        </p>
        <Button
          onClick={() => file && start(source as ImportSource, file)}
          disabled={!file || running}
        >
          {running ? "Importing" : "Import"}
        </Button>
      </div>
    </div>
  );
}
