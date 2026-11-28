import { BrowseFiltersButton } from "@/components/explore/browse-filters";
import { RankingList } from "@/components/explore/ranking-list";
import { PageBack } from "@/components/klyvi/page-back";

export const metadata = {
  title: "Top films · Klyvi",
  alternates: { canonical: "/explore/top-100-films" },
};

export default function TopFilmsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6">
      <PageBack className="mb-6" />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">Top films</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The best-rated 1,000 films with at least 2,000 votes on TMDB,
            ranked by score and votes together. Refreshed daily.
          </p>
        </div>
        <BrowseFiltersButton />
      </div>
      <RankingList kind="movies" />
    </main>
  );
}
