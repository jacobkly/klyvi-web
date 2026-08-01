import { RankedRow } from "@/components/explore/ranked-row";
import { placeholderRanking, TOP_100_NOTE } from "@/lib/mock-top100";

export const metadata = { title: "Top 100 series · Klyvi" };

export default function Top100TvPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Top 100 series</h1>
      <p className="mt-1 text-sm text-muted-foreground">{TOP_100_NOTE}</p>
      <ol className="mt-8 flex flex-col gap-2">
        {placeholderRanking(100).map((item) => (
          <RankedRow key={item.rank} item={item} />
        ))}
      </ol>
    </main>
  );
}
