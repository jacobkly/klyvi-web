import { notFound } from "next/navigation";

import { BrowseClient } from "@/components/explore/browse-client";
import { BROWSE_CATEGORIES } from "@/lib/browse-categories";

export function generateStaticParams() {
  return Object.keys(BROWSE_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = BROWSE_CATEGORIES[category];
  return { title: cat ? `${cat.title} · Klyvi` : "Explore · Klyvi" };
}

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = BROWSE_CATEGORIES[category];
  if (!cat) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{cat.title}</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        {cat.kind === "movie" ? "Films" : "TV"} from the whole catalog, more
        as you scroll.
      </p>
      <BrowseClient category={cat} />
    </main>
  );
}
