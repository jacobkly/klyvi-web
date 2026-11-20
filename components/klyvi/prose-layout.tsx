import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The reading page for terms, privacy, and other prose. Text keeps a
 * readable measure (about 760px). A page with a contents list widens on large
 * screens and puts the list in a sticky column beside the text.
 * Content styled through descendant selectors so the legal pages can be plain
 * markup without per-element classes.
 */
function ProseLayout({
  title,
  updated,
  children,
  className,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-[800px] px-4 py-12 sm:px-6 sm:py-16 lg:has-[[data-slot=prose-contents]]:max-w-6xl",
        className,
      )}
    >
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {updated ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Last updated {updated}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-8 text-[15px] leading-relaxed text-muted-foreground",
          "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
          "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
          "[&_p]:mb-4",
          "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1",
          "[&_a]:text-violet-text [&_a]:underline-offset-4 hover:[&_a]:underline",
          "[&_strong]:font-semibold [&_strong]:text-foreground",
        )}
      >
        {children}
      </div>
    </main>
  );
}

export type ProseSection = {
  /** The heading's anchor, linked from the contents list. */
  id: string;
  title: string;
  body: ReactNode;
};

/**
 * A legal page's body: a numbered contents list, then each section under a
 * numbered heading the list links to. One array feeds both, so the two can't
 * drift apart.
 */
function NumberedSections({ sections }: { sections: ProseSection[] }) {
  return (
    <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
      <nav
        aria-label="Contents"
        data-slot="prose-contents"
        className="mt-8 lg:sticky lg:top-24 lg:mt-10 lg:self-start"
      >
        <p className="mb-2 text-sm font-semibold text-foreground">Contents</p>
        <ol className="text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="max-w-[760px]">
        {sections.map((s, i) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id}>
              <span className="font-mono text-muted-foreground">{i + 1}.</span>{" "}
              {s.title}
            </h2>
            {s.body}
          </section>
        ))}
      </div>
    </div>
  );
}

export { NumberedSections, ProseLayout };
