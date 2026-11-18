import { Button } from "@/components/ui/button";

/**
 * The "something broke" message both error boundaries show. Copy per
 * 06-copy.md. retry() fetches the page again and re-renders it.
 */
export function ErrorPanel({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-[15px] font-semibold text-foreground">
        Something broke on this page.
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Something went wrong on Klyvi&apos;s end. Your library and ratings are
        safe.
      </p>
      <Button className="mt-5" onClick={retry}>
        Try again
      </Button>
    </main>
  );
}
