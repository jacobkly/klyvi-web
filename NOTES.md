# Klyvi build notes

Append-only log. One section per surface (or major phase).

## Phase 0 — Scaffold + design system

**Decisions:**
- Hand-scaffolded the Next.js project (package.json + configs + shadcn primitives) instead of running `create-next-app` / `npx shadcn add`, because the working directory wasn't empty (existing README, .gitignore, DESIGN.md, docs/), `create-next-app` errors in that case, and the shadcn CLI interactive prompts would have stalled an autonomous run.
- Ported the shadcn primitives by hand from the canonical shadcn-ui sources. Each lives in `components/ui/*.tsx` and uses the same Radix package + variants pattern as upstream. Token-only — no raw hex in the primitives.
- Forced dark mode at the `<html>` level (no toggle, no next-themes provider). DESIGN.md says dark-only for beta.
- Skip-to-content link is in the root layout, `aria-hidden` ambient blobs use `motion-safe:` so reduced-motion users get static gradients.
- `Toaster` mounted at the root; default position top-right. No bottom nav added for mobile (per PLAN.md default — revisit in Phase 2.3).
- Icons: Lucide only, `strokeWidth={1.5}` enforced. (Saw the ui-ux-pro-max icons domain suggested Phosphor — overrode to Lucide because PLAN/DESIGN already lock Lucide and the ecosystem is more consistent.)
- Sonner: installed as a regular npm dep (the `npx shadcn add sonner` install pattern would still wrap `sonner` — same end result).
- placeholder.ts uses real TMDB IDs and real TMDB image paths so the design feels real. `next.config.mjs` whitelists `image.tmdb.org` only.
- Type strictness: `tsconfig.json` has `strict: true`. No `any` in any file.

**For review when you return:**
- Some TMDB poster paths in placeholder.ts are best-guesses; if any 404, the Next/Image error event will surface them — easy to swap.
- The "celebration" color (#e0aaff) is mapped through both `--celebration` and tailwind `colors.celebration`. Used so far in tabbed badges + onboarding completion (when surface 6 lands).

**TODOs left for later (still in scope):**
- Wire ⌘K / Ctrl-K global shortcut from the `(app)` layout — deferred until surface 3 (Search) lands.
- The `(app)` header has nav links (Home/Search/Library) — surface 5 fills `/library`, surface 3 fills `/search`.

## Surface 1 — Media Detail

**Decisions:**
- Built shared primitives in `components/media/` (BackdropHero, PosterCard, RatingPill, GenreBadgeRow, CastRow, FeedRow, MediaActions) so all subsequent surfaces compose from them — locks visual primitives early per PLAN.md.
- Built the real `WhyThisRec` component now (surface 7's deliverable) instead of stubbing — the trigger lives on this page and full hover-card was small enough to ship correctly here. Has a tap-fallback to Popover for touch devices.
- Page hardcoded to render `parasite` regardless of `[id]` param (per the surface prompt's "use Parasite as placeholder" line and the no-API rule).
- `MediaActions` is a tiny client island so Log/Watchlist toasts can fire — the rest of the page stays static.
- "Log" button uses an absolute blur layer behind it as the CTA glow per DESIGN.md §7. Toggles to "Logged" + secondary variant on click.
- Star rating shown in poster + meta row uses `fill-accent` on Lucide Star.
- `force-static` is set on the page so Vercel-style static export works.

**For review when you return:**
- The `[id]` param is currently ignored. When real catalog data is wired in, the page becomes data-driven.
- TMDB profile/poster paths are real but TMDB sometimes updates them — if any 404, the Avatar falls back to initials and Image renders a broken-img placeholder gracefully.

**TODOs left for later:**
- Replace the hardcoded `parasite` lookup with a real fetch when backend integration starts.
- Add a back-to-top affordance? Not in surface prompt, deferring.

## Build hygiene
- Moved `themeColor` from `metadata` to `viewport` export in `app/layout.tsx` to satisfy Next.js 15.

## Surface 2 — Home Feed

**Decisions:**
- Built `AmbientBlobs` as a CSS-only component (no framer-motion). Two purple radial blobs with `motion-safe:animate-drift-1/2`, mounted under a `-z-10` layer. Cheaper, SSR-safe, plenty "lit."
- Built `FeaturedCard` as a 16:9 / 21:9 (md+) hero with a left-edge gradient that fades the text onto the backdrop image. Adds a "Featured" badge using `--accent` overlay color, plus star rating, and a "See details" pill that scales on hover.
- Used the three rows the user's appended spec called out — Continue Watching / Because you liked Parasite / New to you — instead of my plan's two rows.
- Stagger entrance: each card gets `animation-delay: i * 40ms` via inline style on top of `animate-fade-up`. Pure CSS, no client JS. Reduced-motion users get instant render via the global stylesheet rule.
- Featured card uses `parasite.backdrop_path` for a wide image; falls back to poster_path if absent. Subsequent rows use `PosterCard` which is the primitive surface 1 introduced.

**For review when you return:**
- The hero copy is light on personalization signal — would feel cooler with real numbers ("23 new picks today"). Holding back since beta has no real state.
- Drift animation runs continuously; on low-power devices this may show in dev tools. It's a 60-75s loop so should be fine.

**TODOs left for later:**
- Real "Continue Watching" needs to pull from actual user state — surfaces only one item currently.

## Surface 3 — Search

**Decisions:**
- Built `SearchResults` as the single client component, used in `page` and `dialog` variants. Page variant lives at `/search`; the dialog variant is wired up for ⌘K later (deferred — not in surface prompt, no current need).
- Used `cmdk`'s built-in fuzzy via `shouldFilter={false}` and my own filter on title + keywords. Cleaner control over result count + grouping.
- Recent / Trending shown when query is empty; live results when typing. No debouncing needed — filtering is in-memory and instant.
- Each result row is a `CommandItem` with poster thumb (48×48 rounded) + title + year + first two genres + a tap-target log button on the right. Log button uses `e.stopPropagation` + `preventDefault` so it fires a toast without navigating.
- Empty-state copy follows the ui-ux-pro-max rule: "Nothing found for X. Try a broader search." — never "0 results."
- Kept the ⌘K dialog wiring out for now — surface prompt didn't request it and the dedicated page is the primary surface per the user's appended brief.

**For review when you return:**
- The keyboard shortcut hint at the bottom (Enter to open top result) is accurate — cmdk's selection runs `gotoMedia` via `onSelect`.

**TODOs left for later:**
- Optional: wire ⌘K globally from `(app)/layout.tsx`. Logged here; not blocking.

## Surface 4 — Season Detail

**Decisions:**
- Path follows the user's appended spec: `app/(app)/media/[id]/season/[season]/page.tsx` (not my plan's `tv/[id]/seasons/[seasonNum]`). Both params ignored — content is always Severance Season 2.
- Built `SeasonDetail` as the orchestrator client component (watched state lives there) and `EpisodeRow` as a per-row child. State is a `Map<episodeId, boolean>` initialized from placeholder data.
- Progress bar uses the shadcn `Progress` and animates on watched-count change via the indicator's `transition-transform duration-hero ease-expo`.
- Per-episode rating is a 5-star inline row inside each episode card. Clicking the current rating clears it. Toasts fire on each change.
- Breadcrumb at the top links back to the series via `/media/${series.id}` (the same demo media-detail page for now). Visual cues — chevron separator, current page styled `font-medium text-foreground`.
- Stills use `next/image` with `w300` size, lazy-loaded by default.
- AspectRatio components used on poster (2:3) and stills (16:9) to lock layout — zero CLS.

**For review when you return:**
- "Mark all watched" / "Clear all" affordance isn't here — small addition for surface polish later.
- Episode overview is intentionally `line-clamp-1` to keep rows compact. A click-to-expand could come later but the surface prompt didn't ask.

**TODOs left for later:**
- Wire watched state to real persistence when backend lands. Currently lives in component state only.
