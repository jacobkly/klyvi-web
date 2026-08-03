"use client";

import * as React from "react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/auth-provider";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "@/lib/api/users";

import { SectionHeading } from "./section";

const CONFIRM_PHRASE = "delete my account";

/**
 * The full type-to-confirm shape, so wiring the real endpoint later is a
 * one-line swap. Until then the confirm says plainly that deletion is not
 * built, rather than pretending.
 */
export function DeleteSection() {
  const { signOut } = useSession();
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const armed = typed.trim().toLowerCase() === CONFIRM_PHRASE;

  function run() {
    setBusy(true);
    deleteAccount()
      .then(() => {
        toast("Your account has been deleted.");
        void signOut();
      })
      .catch(() => {
        toast("Could not delete the account. Try again.");
        setBusy(false);
      });
  }

  return (
    <section>
      <SectionHeading>Delete account</SectionHeading>
      <div className="mt-6 max-w-[440px] rounded-lg border border-destructive/40 p-5">
        <p className="text-sm text-muted-foreground">
          Deletes your account, your library, your ratings, and your taste
          profile. There is no undo and no recovery period.
        </p>
        <div className="mt-4">
          <AlertDialog onOpenChange={() => setTyped("")}>
            <AlertDialogTrigger
              className={buttonVariants({ variant: "destructive", size: "sm" })}
            >
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your account, library, ratings, and taste profile are
                  removed permanently. Type{" "}
                  <span className="font-medium text-foreground">
                    {CONFIRM_PHRASE}
                  </span>{" "}
                  to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div>
                <Label htmlFor="st-delete-confirm" className="sr-only">
                  Confirmation phrase
                </Label>
                <Input
                  id="st-delete-confirm"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={!armed || busy}
                  onClick={run}
                >
                  {busy ? "Deleting" : "Delete my account"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
}
