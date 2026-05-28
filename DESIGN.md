# Klyvi Design System

> Source of truth for every visual and interaction decision in `klyvi-web`. Read at the start of every session. If a prompt and this file disagree, this file wins.

The design system is **locked**. Do not invent colors, fonts, radii, easings, durations, or shadows outside what's in this file. Token use only.

---

## 1. Tone

Cinema-poster restraint over busy interface. 2026 streaming app feel, not 2014 diary app. Taste-forward, modern, tactile. Inspiration sits in the neighborhood of 21st.dev, Linear, Vercel — confident dark UI with hairline borders, soft glow on hero actions, ambient color, generous space.

Dark mode is the only mode in beta.

## 2. Typography

**One typeface: Geist Sans.** Weights used: 400 (body), 500 (label/h3), 600 (h1/h2/display). Never 700+ except at display size.

Scale (exact — do not improvise):

| Role | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|
| Display | 48 / 64 / 80px (responsive) | 600 | -0.02em | 1.05 |
| H1 | 32px | 600 | -0.02em | 1.15 |
| H2 | 24px | 600 | -0.01em | 1.2 |
| H3 | 20px | 500 | -0.01em | 1.3 |
| Body | 15px | 400 | 0 | 1.6 |
| Small / meta | 13px | 400 | 0 | 1.5 |
| Caption | 12px | 500 | 0.02em (uppercase) | 1.4 |
| Tabular numerals | as-is | 400 | use `tabular-nums` for ratings, runtimes, episode counts | — |

**Body minimum: 15px on desktop, 16px on mobile** (16px prevents iOS auto-zoom on input focus).

**Line length:** body capped at ~70ch (max-w-prose); never edge-to-edge paragraphs.

## 3. Color tokens

Use HSL via shadcn variables in `app/globals.css`. Never reference raw hex in components.

```css
@layer base {
  :root, .dark {
    /* Surfaces — elevation = lighter purple */
    --background: 258 100% 8%;      /* #10002b deepest */
    --card: 269 100% 14%;            /* #240046 elevated */
    --popover: 269 100% 14%;
    --muted: 270 60% 18%;            /* chips, hover-bg */

    /* Text */
    --foreground: 270 20% 98%;       /* near-white, faint purple cast */
    --card-foreground: 270 20% 98%;
    --muted-foreground: 270 15% 70%;

    /* Working accent */
    --primary: 273 68% 58%;          /* #9d4edd CTAs */
    --primary-foreground: 0 0% 100%;
    --accent: 273 100% 74%;          /* #c77dff hover/highlight */
    --accent-foreground: 270 100% 10%;

    /* Celebration only — onboarding completion, "match" badges */
    --celebration: 277 100% 84%;     /* #e0aaff — use sparingly */

    /* Lines */
    --border: 270 50% 22%;
    --input: 270 50% 22%;
    --ring: 273 68% 58%;

    /* Semantic */
    --destructive: 0 70% 60%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 60% 45%;
    --success-foreground: 0 0% 98%;

    --radius: 0.625rem;              /* 10px base */
  }
}
```

**Rules:**
- No pure black, no pure white. We use `#10002b` and near-white (`hsl(270 20% 98%)`).
- Maximum **two accent colors visible on a single screen**. Usually `--primary` is enough.
- `--celebration` (`#e0aaff`) is reserved for: onboarding completion, "match strength" badge, and the rare moment of delight. Not for general highlights.
- Borders prefer the **hairline rule** (see §6) — `rgba(255,255,255,0.06)` — over solid `--border`. Solid border is for inputs and structural separators only.

## 4. Surface elevation

Elevation is communicated by **lighter purple**, not by shadow. Levels:

| Level | Background | When |
|---|---|---|
| 0 — Page | `--background` (#10002b) | The page itself |
| 1 — Card | `--card` (#240046) | Resting card |
| 2 — Hover / interactive raised | `--card` + subtle glow ring | Hovered poster, focused card |
| 3 — Modal / sheet | `--card` + scrim under + glow shadow | Dialog, sheet, popover |

A modal scrim is `rgba(16, 0, 43, 0.7)` with backdrop-blur 8px.

## 5. Radius

| Element | Radius |
|---|---|
| Buttons | `rounded-lg` (8px) |
| Cards / surfaces | `rounded-xl` (12px) |
| Posters / media tiles | `rounded-xl` (12px) |
| Inputs | `rounded-lg` (8px) |
| Pills / chips / badges | `rounded-full` |
| Modals / sheets | `rounded-2xl` (16px) |
| Avatars | `rounded-full` |

## 6. Spacing

Tailwind defaults only: 1/2/3/4/6/8/12/16/24 (= 4/8/12/16/24/32/48/64/96 px). Section spacing tiers:

- **Item gap** (inside a row): `gap-2` (8px) to `gap-3` (12px)
- **Component padding** (inside a card): `p-4` to `p-6` (16-24px)
- **Section spacing** (between sections on a page): `space-y-8` (32px) desktop, `space-y-6` (24px) mobile
- **Page padding** (page edges): `px-4 md:px-8` (16/32px)
- **Container max-width**: `max-w-7xl` for full-width sections; `max-w-prose` for long-form text

8dp rhythm throughout. No arbitrary spacing values.

## 7. Borders, shadows, glow

In dark mode, real shadows mostly don't work. Use elevation through color (§4). Where lift is needed:

### Hairline border (default for cards, headers, separators)
```css
border: 1px solid rgba(255, 255, 255, 0.06);
```
Tailwind: `border border-white/[0.06]`.

### Glow (modals, hovered posters)
```css
box-shadow:
  0 0 0 1px rgba(199, 125, 255, 0.15),
  0 8px 32px rgba(16, 0, 43, 0.6);
```
Use `shadow-glow` utility (define in `globals.css`).

### CTA accent glow (primary buttons)
A subtle 30px radial behind the primary CTA, color `hsl(var(--primary) / 0.4)`. Implement as a pseudo-element with `blur-2xl`:
```html
<button class="relative isolate ...">
  <span aria-hidden class="absolute inset-0 -z-10 rounded-lg bg-primary/40 blur-2xl"></span>
  Log
</button>
```

### Ambient background (heroes only)
Two large purple blobs (radial-gradient), absolute-positioned, `blur-3xl`, opacity 0.15-0.25, slowly drifting (60-90s loop). Used on home hero and onboarding background.

## 8. Glassmorphism

For sticky headers, the app shell, and certain overlays:
```
bg-card/60 backdrop-blur-xl border-b border-white/[0.06]
```
Only on **fixed/sticky chrome and overlays** — not on resting cards. Beta limit: glass on header + on hover-cards. Nowhere else.

## 9. Motion tokens

| Token | Value | Use |
|---|---|---|
| `--ease-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for entrances, sheet slide-in, hero reveals |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Hover/focus/leave transitions |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Subtle overshoot on press release |
| `--duration-instant` | 100ms | Color/opacity flicks |
| `--duration-fast` | 150ms | Hover, focus ring |
| `--duration-base` | 200ms | Layout shifts, card scale, dropdown |
| `--duration-slow` | 300ms | Sheets, modals, route transitions |
| `--duration-hero` | 400ms | Big reveals, onboarding card change |

**Universal rules:**
- Exit animations are 60-70% the duration of their enter counterpart (modals snap out faster than they slide in).
- Animate **transform** and **opacity** only. Never animate `width`/`height`/`top`/`left`.
- Stagger list/grid item entrance 30-50ms per item; cap stagger total at 400ms.
- Crossfade for content replacement inside the same container.
- Modal/sheet motion is interruptible. Tap/ESC cancels in-flight animation.

**Press feedback (every clickable card or button):**
```
default: scale-100
active:  scale-[0.97] with --ease-spring on release
hover:   (cards only) scale-[1.02] + shadow-glow on top of --ease-out 150ms
```
Don't animate buttons on hover (size/transform). Buttons get color/glow shifts only. Cards get scale.

**Tap feedback budget:** visual response within 100ms of pointer down.

## 10. Reduced motion (mandatory)

Wrap every animation in `prefers-reduced-motion: no-preference`, or use Tailwind's `motion-safe:` prefix:

```html
<div class="motion-safe:transition-transform motion-safe:hover:scale-[1.02]">
```

A user with `reduce` set should see **instant state changes, no transform, no parallax, no ambient blob drift**. The blobs should still render (visual presence is fine) but not animate.

## 11. Imagery

**All images use `next/image`** — never `<img>`.

```tsx
<Image
  src={posterUrl}
  alt={`Poster for ${title}`}
  width={300}
  height={450}
  className="rounded-xl"
  sizes="(max-width: 768px) 50vw, 200px"
  placeholder="blur"
  blurDataURL={...}
/>
```

- Always reserve aspect ratio via explicit `width`/`height` or `aspect-ratio` to prevent CLS.
- Use TMDB poster dimensions: posters 2:3, backdrops 16:9. Wrap in shadcn `<AspectRatio>` for safety.
- `placeholder="blur"` with a low-res blurDataURL on hero/poster images.
- `priority` only on above-the-fold hero imagery; never on a row of posters.
- `sizes` declared on every responsive image.

## 12. Iconography

**Lucide React only.** No emoji as UI icons. No mixing icon families.

- Default size: 16px (inline with body), 20px (buttons), 24px (nav, large affordances).
- Stroke width: 1.5 (use the `strokeWidth={1.5}` prop). Consistent across the whole app.
- Icon-only buttons require `aria-label`.
- Pair icons with text labels in primary nav (never icon-only nav).

## 13. Interaction states (mandatory per element)

Every interactive element implements four states:

| State | Treatment |
|---|---|
| Resting | Token color |
| Hover | Color shift (e.g. `--primary` → `--accent`) + 150ms ease-out |
| Active / Pressed | `scale-[0.97]` + slight darken |
| Focus-visible | `ring-2 ring-ring ring-offset-2 ring-offset-background` |
| Disabled | `opacity-50 cursor-not-allowed` + no hover state |

**Never** `outline-none` without `focus-visible:ring-*` replacement. Focus rings are non-negotiable.

## 14. Touch targets

Minimum 44×44px hit area on any tappable element. Small icons need padded wrappers (`p-2.5` on a 24px icon gives 44px). 8px minimum spacing between adjacent touchables.

## 15. Loading states (mandatory)

Skeleton screens, never spinners (except inside disabled action buttons during async submit).

- Every route has a `loading.tsx` in App Router.
- Skeletons match the eventual layout's shape and dimension — same aspect ratios, same widths. No generic gray bars.
- Skeleton shimmer uses `animate-pulse` with `motion-safe:`.
- Show skeleton if data exceeds 300ms; instant content otherwise.

## 16. Empty states (mandatory)

Every list/grid/feed handles "no content yet" with:
1. A muted Lucide icon (24-32px) centered.
2. A one-line headline ("Nothing here yet").
3. A one-line subtext explaining how to get content here.
4. A primary CTA pointing at the closest action.

Never a blank panel. Never the literal text "No results."

## 17. Error states (mandatory)

For data fetch failures: surface error inline with a "Retry" action. For form validation: error message **below the field**, with `role="alert"` and `aria-live="polite"`. For destructive actions: confirmation dialog before commit.

Every error message includes **cause + recovery path** ("Couldn't load this season. Retry?"). Never just "Error."

## 18. Accessibility floor (non-negotiable)

- **WCAG AA contrast minimum** for all text. AAA target for body text (verify near-white on `--background`).
- **Keyboard reachable**: tab order matches visual order, no traps, ESC closes overlays.
- **Skip link** in root layout: `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>`.
- **Semantic HTML**: `<main>`, `<nav>`, `<article>`, `<section>`, headings sequential (no h1→h3 skip).
- **Icon-only buttons** have `aria-label`.
- **Images** have meaningful `alt` (poster: `Poster for {title}`). Decorative images: `alt=""`.
- **Form fields** have visible `<label>`, helper text, inline error with `aria-describedby`.
- **`prefers-reduced-motion`** respected universally.
- **Live regions** for toasts (`aria-live="polite"`) and form errors (`role="alert"`).
- **Color is never the only carrier of meaning** — pair semantic colors with icon or text.

## 19. Mobile patterns

- Mobile-first: design for 375px width then scale up.
- Breakpoints: `sm:640 md:768 lg:1024 xl:1280`.
- Bottom-sheet (shadcn `<Sheet side="bottom">`) over modal (`<Dialog>`) for filters, secondary detail, anything users will dismiss often. Modal reserved for confirmation/destructive flows.
- Use `min-h-dvh` instead of `min-h-screen` (avoids mobile-browser chrome jump).
- Horizontal scroll for poster rows: `snap-x snap-mandatory`, hide scrollbar (`[&::-webkit-scrollbar]:hidden`).
- Safe-area: padding-bottom on sticky bottom nav uses `env(safe-area-inset-bottom)`.
- Inputs reach ≥44px height on mobile.

## 20. Do not

- Use multiple competing accent colors on one screen.
- Add gradients except subtle background washes and the CTA glow.
- Use icons without labels in primary nav.
- Use serif fonts anywhere yet.
- Build any social/community surfaces (followers, public reviews, comments).
- Animate `width`, `height`, `top`, `left`. Transforms only.
- Use raw hex literals in components — token only.
- Use `z-[9999]`. Use the scale: `z-10` (sticky nav), `z-20` (dropdowns), `z-30` (sheets), `z-40` (modal scrim), `z-50` (modal content), `z-[60]` (toasts).
- Use `outline-none` without a `focus-visible:ring-*` replacement.
- Reach for framer-motion before trying `tailwindcss-animate` + CSS transitions. (Framer-motion is allowed for the home-hero ambient blob and the onboarding card flip; nowhere else without justification.)
