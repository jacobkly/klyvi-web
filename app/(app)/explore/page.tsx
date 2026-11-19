import { ExploreClient } from "./explore-client";

export const metadata = {
  title: "Explore · Klyvi",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; q?: string | string[] }>;
}) {
  const { focus, q } = await searchParams;
  return (
    <ExploreClient
      autofocus={focus === "1"}
      initialQuery={(Array.isArray(q) ? q[0] : q) ?? ""}
    />
  );
}
