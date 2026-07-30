import { LibraryClient } from "./library-client";

export const metadata = { title: "Your library · Klyvi" };

/**
 * The golden screen. Data flows through the client loader so the mock layer
 * swaps for the authed API client without touching the view. The `state`
 * search param exercises the loading, error, and empty paths until the real
 * backend provides them for free.
 */
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  return <LibraryClient simulate={state} />;
}
