import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Desktop's way back from a details page, level with the top of the rail and
 * over the artwork. The shell draws it, so a page that is loading, failed or
 * missing has it too. Phones get the arrow in their top bar.
 */
function DetailBack({ onBack, railed }: { onBack: () => void; railed: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 hidden md:block",
        railed && "md:pl-20"
      )}
    >
      <div className="mx-auto max-w-[1400px] px-6 pt-8">
        <Button
          variant="ghost"
          size="lg"
          onClick={onBack}
          className="pointer-events-auto glass border hover:border-foreground/40 hover:bg-muted dark:hover:bg-muted"
        >
          <ArrowLeft
            aria-hidden="true"
            data-icon="inline-start"
            className="transition-transform group-hover/button:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/button:translate-x-0"
          />
          Back
        </Button>
      </div>
    </div>
  );
}

export { DetailBack };
