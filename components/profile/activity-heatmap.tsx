import { MOCK_HEATMAP } from "@/lib/mock-stats";
import { cn } from "@/lib/utils";

/** Intensity 0 to 4 onto the violet chart ramp, cool to hot. */
const CELL_COLORS = [
  "bg-muted/40",
  "bg-chart-5",
  "bg-chart-4",
  "bg-chart-2",
  "bg-chart-1",
];

/**
 * The GitHub-style year grid. Purely presentational; the sample data
 * lives in mock-stats until the backend can say when things were watched.
 */
export function ActivityHeatmap() {
  const total = MOCK_HEATMAP.flat().filter((v) => v > 0).length;
  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div aria-hidden="true" className="flex w-max gap-[3px]">
          {MOCK_HEATMAP.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {week.map((intensity, d) => (
                <div
                  key={d}
                  className={cn(
                    "size-2.5 rounded-[2px]",
                    CELL_COLORS[intensity]
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">
        Activity for the last year: {total} active days out of{" "}
        {MOCK_HEATMAP.flat().length}.
      </p>
      <div
        aria-hidden="true"
        className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground"
      >
        Less
        {CELL_COLORS.map((c) => (
          <span key={c} className={cn("size-2.5 rounded-[2px]", c)} />
        ))}
        More
      </div>
    </div>
  );
}
