import { FindClient } from "./find-client";

export const metadata = { title: "Find your next watch · Klyvi" };

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  return <FindClient simulate={state} />;
}
