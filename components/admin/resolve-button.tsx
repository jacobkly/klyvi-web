"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { setErrorResolved } from "@/lib/api/admin";

/** Resolves an open group or reopens a resolved one, then reloads the list. */
export function ResolveButton({
  id,
  resolved,
}: {
  id: number;
  resolved: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    setSaving(true);
    setFailed(false);
    try {
      await setErrorResolved(id, !resolved);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="touch"
        variant={resolved ? "outline" : "default"}
        disabled={saving}
        onClick={toggle}
      >
        {resolved ? "Reopen" : "Resolve"}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t save that. Try again.
        </p>
      )}
    </div>
  );
}
