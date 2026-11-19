import { RateDeck } from "./rate-deck";

export const metadata = { title: "Rate some films · Klyvi" };

export default async function RatePage({
  searchParams,
}: {
  searchParams: Promise<{ redo?: string }>;
}) {
  // Settings' "Redo my taste" starts the deck over at the first card.
  const { redo } = await searchParams;
  return <RateDeck redo={redo === "1"} />;
}
