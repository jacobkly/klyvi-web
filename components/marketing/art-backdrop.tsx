/**
 * The landing page's backdrop: the hero's own posters, blown up, blurred and
 * dimmed under a scrim, fixed behind the content. The artwork is the only
 * colour, as in the app, so there is no violet here. It reuses the poster
 * URLs the hero strip already loads, so it adds no requests before the hero,
 * and it never moves, so reduced motion has nothing to hold still.
 */
export function ArtBackdrop({ posters }: { posters: string[] }) {
  const art = posters.slice(0, 3);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-background">
      {art.length > 0 ? (
        <div
          data-testid="art-backdrop"
          className="absolute inset-0 grid scale-110 grid-cols-3 opacity-45 blur-2xl"
        >
          {art.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p}
              src={`https://image.tmdb.org/t/p/w342${p}`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ))}
        </div>
      ) : null}
      {/* The scrim keeps body text at 4.5:1 over any poster. */}
      <div className="absolute inset-0 bg-background/75" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
    </div>
  );
}
