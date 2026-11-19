"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { downloadAccountData, exportTracking } from "@/lib/api/users";
import { ImportFlow } from "@/components/imports/import-flow";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { FieldStack, SectionHeading, SettingRow } from "./section";

/** Runs a download and says so if it fails. */
function download(run: () => Promise<void>) {
  run().catch(() => toast("Could not prepare the download. Try again."));
}

/**
 * Import runs in a dialog: pick the source, drop the export, watch the
 * progress bar fill as titles match. The flow itself (and its polling) lives
 * in ImportFlow, shared with the onboarding step; this only frames it and
 * announces the result.
 */
function ImportDialog() {
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
            Klyvi reads the export and matches it against the catalog. Nothing
            is posted anywhere.
          </DialogDescription>
        </DialogHeader>

        <ImportFlow
          onDone={(j) =>
            toast(
              `Imported ${j.matched} of ${j.total}. ${j.unmatched} could not be matched.`
            )
          }
          onFailed={(j) => toast(j.error ?? "The import failed.")}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Import, and the one export. CSV is the library for a spreadsheet. JSON is
 * everything Klyvi holds about the account, the same bundle a data request
 * would get.
 */
export function DataSection() {
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

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Export your data
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Files you can keep. Nothing leaves Klyvi unless you download it.
            </p>
          </div>
          <SettingRow
            title="Your library"
            description="One row per film or season, with status, score and progress. Opens in any spreadsheet."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => download(() => exportTracking("csv"))}
            >
              Download CSV
            </Button>
          </SettingRow>
          <SettingRow
            title="Everything"
            description="Your account, library, ratings, full history, imports and taste profile, as Klyvi keeps them."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => download(downloadAccountData)}
            >
              Download JSON
            </Button>
          </SettingRow>
        </div>
      </FieldStack>
    </section>
  );
}
