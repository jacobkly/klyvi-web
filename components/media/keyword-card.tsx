import { Badge } from "@/components/ui/badge";
import type { Keyword } from "@/lib/mock-media";

/**
 * The Klyvi-specific card: the keywords the recommender actually scores on
 * (06-copy.md: "What this is made of"). The API does not yet expose per-title
 * relevance weights, so this renders names only. No invented percentages:
 * fabricated numbers would poison the product's one differentiator, honesty
 * about why. When the backend ships weights, they slot in right-aligned here.
 */
function KeywordCard({ keywords }: { keywords: Keyword[] }) {
  return (
    <div>
      <h2 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
        What this is made of
      </h2>
      {keywords.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No keywords yet, so Klyvi is going on genre and cast for this one.
        </p>
      ) : (
        <>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <Badge key={k.id} variant="secondary" className="text-violet-text">
                {k.name}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Klyvi weights these when it looks for something similar.
          </p>
        </>
      )}
    </div>
  );
}

export { KeywordCard };
