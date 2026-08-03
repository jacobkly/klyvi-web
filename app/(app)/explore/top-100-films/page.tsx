import { RankingList } from "@/components/explore/ranking-list";

export const metadata = { title: "Top 100 films · Klyvi" };

export default function Top100FilmsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Top 100 films</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        The highest-rated films in the catalog, refreshed daily.
      </p>
      <RankingList kind="movies" />
    </main>
  );
}
