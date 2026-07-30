"use client";

import * as React from "react";

import { LibraryView } from "@/components/library/library-view";
import { MOCK_LIBRARY } from "@/lib/mock-library";
import type { LibraryEntry } from "@/lib/types";

/**
 * Client boundary that owns the loader. Swaps for the real API client when
 * auth lands; LibraryView never changes.
 */
export function LibraryClient({ simulate }: { simulate?: string }) {
  const load = React.useCallback((): Promise<LibraryEntry[]> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (simulate === "error") reject(new Error("simulated"));
        else if (simulate === "empty") resolve([]);
        else if (simulate === "loading") {
          /* never resolves: holds the skeleton state */
        } else resolve(MOCK_LIBRARY);
      }, 450);
    });
  }, [simulate]);

  return <LibraryView load={load} />;
}
