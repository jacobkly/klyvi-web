import { cn } from "@/lib/utils";

/** Intensity 0 to 4 onto the violet chart ramp, cool to hot. */
const CELL_COLORS = [
  "bg-muted/40",
  "bg-chart-5",
  "bg-chart-4",
  "bg-chart-2",
  "bg-chart-1",
];

function intensity(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

/**
 * The GitHub-style year grid, from the server's daily activity series
 * (371 days ending today). Chunked into columns of seven so each column
 * is a week.
 */
export function ActivityHeatmap({
  activity,
}: {
  activity: { date: string; count: number }[];
}) {
  const max = activity.reduce((m, d) => Math.max(m, d.count), 0);
  const active = activity.filter((d) => d.count > 0).length;

  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < activity.length; i += 7) {
    weeks.push(activity.slice(i, i + 7));
  }

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div aria-hidden="true" className="flex w-max gap-[3px]">
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count}`}
                  className={cn(
                    "size-2.5 rounded-[2px]",
                    CELL_COLORS[intensity(day.count, max)]
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">
        Activity for the last year: {active} active days out of{" "}
        {activity.length}.
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
