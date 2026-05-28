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
