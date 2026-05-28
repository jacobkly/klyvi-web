import { Search } from 'lucide-react';
import { SearchResults } from '@/components/search/search-results';
import { AmbientBlobs } from '@/components/motion/ambient-blobs';

export const metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <div className="relative pb-16">
      <AmbientBlobs intensity="low" />
      <section className="px-4 md:px-8 pt-10 md:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full hairline bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          <Search className="size-3" strokeWidth={1.5} />
          Search
        </div>
        <h1 className="mt-4 text-balance text-3xl md:text-4xl font-semibold tracking-tight">
          Find what you&apos;re looking for.
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Type a title, a year, a keyword like <span className="text-foreground/80">slow-burn</span>, or a director&apos;s name.
        </p>
      </section>

      <section className="px-4 md:px-8 mt-8 max-w-3xl">
        <SearchResults variant="page" />
      </section>
    </div>
  );
}
