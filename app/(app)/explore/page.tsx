import { ExploreClient } from "./explore-client";

export const metadata = { title: "Explore · Klyvi" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  return <ExploreClient autofocus={focus === "1"} />;
}
