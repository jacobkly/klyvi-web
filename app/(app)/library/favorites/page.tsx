import { Star } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { SectionHeader } from "@/components/klyvi/section-header";
import { MOCK_LIBRARY } from "@/lib/mock-library";

export const metadata = { title: "Favorites · Klyvi" };

/**
 * Favorites. The API has no favorites flag yet, so this renders the user's
 * highest-rated titles as the stand-in and says so. Starring lands with the
 * live client.
 */
export default function FavoritesPage() {
  const favorites = MOCK_LIBRARY.filter((e) => (e.score ?? 0) >= 90);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Favorites</h1>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No favorites yet"
          body="Star a film, show, or person and it lands here."
          action={{ label: "Explore", href: "/explore" }}
          className="py-20"
        />
      ) : (
        <section className="mt-8">
          <SectionHeader title="Your highest rated" className="mb-4" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {favorites.map((e) => (
              <PosterCard key={e.mediaId} media={e} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
