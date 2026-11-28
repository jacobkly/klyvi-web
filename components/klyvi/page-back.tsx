"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGoBack } from "@/lib/go-back";
import { cn } from "@/lib/utils";

/**
 * Desktop's way back from a page a tab opens onto, such as a rail's View
 * more, in the same glass pill a details page has. It sits in the page's
 * flow, above the title. Phones get the arrow in their top bar.
 */
export function PageBack({ className }: { className?: string }) {
  const goBack = useGoBack();
  return (
    <div className={cn("hidden md:block", className)}>
      <Button
        variant="ghost"
        size="lg"
        onClick={goBack}
        className="glass border hover:border-foreground/40 hover:bg-muted dark:hover:bg-muted"
      >
        <ArrowLeft
          aria-hidden="true"
          data-icon="inline-start"
          className="transition-transform group-hover/button:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/button:translate-x-0"
        />
        Back
      </Button>
    </div>
  );
}
