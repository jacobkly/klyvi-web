"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { exportTracking } from "@/lib/api/users";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { FieldStack, SectionHeading } from "./section";

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
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              exportTracking(format as "csv" | "json").catch(() =>
                toast("Could not prepare the export. Try again.")
              )
            }
          >
            Download
          </Button>
        </div>
      </FieldStack>
    </section>
  );
}
