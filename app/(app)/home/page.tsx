import { HomeClient } from "./home-client";

export const metadata = { title: "Home · Klyvi" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  return <HomeClient simulate={state} />;
}
