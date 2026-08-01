"use client";

import * as React from "react";
import { FileUp, Upload } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FieldStack, SectionHeading, SettingsNote } from "./section";

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
 * Import runs in a dialog: pick the source, drop the export file, see it
 * listed. The import itself waits on the backend job endpoint, and the
 * button says so instead of pretending.
 */
function ImportDialog() {
  const [source, setSource] = React.useState("letterboxd");
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Dialog>
      <DialogTrigger
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Upload aria-hidden="true" data-icon="inline-start" />
        Import
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import your history</DialogTitle>
          <DialogDescription>
            Klyvi reads the export and matches it against the catalog.
            Nothing is posted anywhere.
          </DialogDescription>
        </DialogHeader>

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
                <p data-numeric className="mt-1 font-mono text-xs text-muted-foreground">
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
        </div>

        <DialogFooter className="items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Importing is not wired up yet. It lands with a coming update.
          </p>
          <Button disabled>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DataSection() {
  const [format, setFormat] = React.useState("csv");

  return (
    <section>
      <SectionHeading>Import and export</SectionHeading>
      <FieldStack>
        <div>
          <p className="text-sm font-medium text-foreground">
            Import your history
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bring in what you already logged on Letterboxd or Trakt.
          </p>
          <div className="mt-3">
            <ImportDialog />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            Export your data
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Everything you have tracked, as a file you can keep.
          </p>
          <RadioGroup
            value={format}
            onValueChange={(v) => setFormat(v ?? "csv")}
            className="mt-3 flex w-auto flex-row gap-4"
          >
            <Label className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value="csv" /> CSV
            </Label>
            <Label className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value="json" /> JSON
            </Label>
          </RadioGroup>
          <Button variant="outline" size="sm" className="mt-3" disabled>
            Download
          </Button>
          <SettingsNote>
            Export is not wired up yet. It lands with a coming update.
          </SettingsNote>
        </div>
      </FieldStack>
    </section>
  );
}
