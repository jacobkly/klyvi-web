import { cn } from "@/lib/utils";

/**
 * The label-above-value metadata rail from the AniList reference: no borders,
 * no table. Null values drop their row entirely rather than rendering a dash.
 */
function MetadataList({
  items,
  className,
}: {
  items: { label: string; value: string | number | null }[];
  className?: string;
}) {
  const present = items.filter((i) => i.value != null && i.value !== "");
  if (present.length === 0) return null;

  return (
    <dl className={cn("flex flex-col gap-3", className)}>
      {present.map((i) => (
        <div key={i.label}>
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd
            className={cn(
              "mt-0.5 text-sm text-foreground",
              typeof i.value === "number" && "font-mono"
            )}
            data-numeric={typeof i.value === "number" || undefined}
          >
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export { MetadataList };
