# Klyvi Web

Next.js frontend for **Klyvi**, a personalized movie and TV discovery app that learns your taste and answers one question well: **what should I watch tonight?**

You track what you watch (films, and TV per season), rate it, and Klyvi turns that into picks that explain themselves with reason chips like "slow burn" or "class differences". Klyvi is free, with no paid tier and no ads.

This repo is the web client only. The Go API lives in [klyvi](https://github.com/jacobkly/klyvi) and owns all recommendation and ranking logic, so the web app stays a thin, fast client.

## Status

Live on Vercel against the Klyvi API. Films work end to end, from onboarding to the personalized feed. TV has series and season pages, per-season tracking, and "More like this". Bringing TV into the personalized feed is the remaining piece.

## What's in it

- **Home:** your top picks, continue watching, recent activity, and a snapshot of the reasons that show up most in your feed.
- **Find:** the full recommendation feed, with mood lenses (something light, heavy, slow burn, under 2 hours, twentieth century) that filter what the feed already carries.
- **Library:** everything you track, by status, with filters and a favorites shelf. The tracking dialog holds status, score, episode progress, notes, and favorite.
- **Explore:** trending, popular, and top-rated browsing, plus Top 100 films and TV.
- **Title pages:** film, series, and season pages with cast, crew, keywords, collections, and a "More like this" shelf that shows why each title is similar.
- **Onboarding:** a swipe deck to rate a first batch of films, or an import from Letterboxd, Trakt, or CSV.
- **Profile and settings:** watch stats and charts, avatar, lists, data export, and account deletion.
- **Legal and support:** privacy, terms, copyright, TMDB attribution, and a donate page for server costs.

Signed-out visitors can browse Explore and every title page. Home, Find, Library, Profile, and Settings need an account.

## Design

The direction is "Dark Room": a near-black, desaturated interface where posters and backdrops are the only color on screen, so the artwork leads and the chrome stays out of the way.

- Violet is used only where the app itself speaks: primary actions, active nav, focus, progress, selection, and reason chips.
- Geist Sans throughout, with Geist Mono for every number that sits in a column (scores, years, runtimes, stats).
- Elevation comes from surface lightness rather than shadow. Controls are pills, surfaces are 8px, and artwork is 5px.
- Reason chips are the signature element. No competitor explains its picks, so they get real prominence.
- Screens are designed for their loading, empty, error, and partial states, not just the happy path. Mobile gets a bottom tab bar instead of a shrunk desktop layout.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- TypeScript (strict)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) on [Base UI](https://base-ui.com/) (not Radix)
- [Supabase JS](https://supabase.com/docs/reference/javascript) for auth
- [Lucide](https://lucide.dev/) icons, [Recharts](https://recharts.org/) for stats, [Sonner](https://sonner.emilkowal.ski/) toasts
- [Vitest](https://vitest.dev/) + Testing Library, ESLint

## Architecture

The client renders, captures interactions (rate / log / dismiss / save), and handles auth. It does not talk to the database directly. Catalog, search, tracking, interactions, and recommendations all go through the Klyvi API. Nothing about scoring or personalization lives here.

Auth is the only piece of state the client owns: Supabase issues the JWT, the client forwards it as a `Bearer` token to the Go API, and the API verifies the signature against the project's JWKS. `proxy.ts` gates the signed-in routes.

Pages paint by section: requests start up front and slower sections stream in behind skeletons, so no page waits on its slowest call. Artwork loads straight from TMDB's image CDN at its fixed widths through a custom image loader, with no optimizer in between.

## Local development

Requires Node 22+ and a running [Klyvi API](https://github.com/jacobkly/klyvi) (by default at `http://localhost:8080`).

```bash
npm install
cp .env.example .env.local
# fill NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Checks:

```bash
npm run lint
npm test
npm run build
```

## Beta UI archive

The previous beta interface lives in [`beta-ui/`](beta-ui/) as a self-contained Next.js app with its own `package.json`, dependencies, and config. It proved the backend end to end and is kept for reference only. The root app is the real build.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
