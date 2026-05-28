# Klyvi Web

Next.js frontend for **Klyvi**, a personalized movie and TV discovery app that learns your taste and helps you find what to watch next.

This repo is the web client only. The Go API lives in [klyvi](https://github.com/jacobkly/klyvi) and owns all recommendation and ranking logic, so the web app stays a thin, fast client.

## Why Klyvi

Streaming platforms have great recommendation engines locked to their own catalog. The category of taste-tracking apps that span every catalog — Letterboxd, Trakt, Serializd — has stale UI and weak personalization. Klyvi is the inverse: bring streaming-grade taste modeling to every film and show that exists, in a modern interface.

Two pillars:

- **Tracking** — log, rate, watchlist. TV is tracked per season, AniList-style, because a strong season 1 and a weak season 4 shouldn't collapse into one number.
- **Recommendation** — a tiered cascade that learns from keywords and cast (not just genre), explains itself ("because you liked *Parasite* and rate slow-burn thrillers highly"), and gets sharper with every interaction.

Every tracking action is also a recommendation signal — the two pillars feed each other.

## Status

Beta. Runnable end-to-end against the Klyvi API. Auth, catalog browsing, search, tracking, onboarding, and the personalized feed are wired. Surface polish and per-card "Why this rec?" reasons are in progress.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + [React 18](https://react.dev/)
- TypeScript (strict)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) primitives
- [Geist Sans](https://vercel.com/font) typography
- [Framer Motion](https://www.framer.com/motion/) for onboarding choreography
- [Sonner](https://sonner.emilkowal.ski/) for toasts
- [Supabase JS](https://supabase.com/docs/reference/javascript) for auth (sign-in/session only; the access token is forwarded to the Go API, which verifies it)
- Hosted on Vercel

## Architecture

The client renders, captures interactions (rate / log / dismiss / save), and handles auth. It does not talk to the database directly. Catalog, search, tracking, interactions, and recommendations all go through the Klyvi API. Nothing about scoring or personalization lives here.

Auth is the only piece of state the client owns: Supabase issues the JWT, the client forwards it as a `Bearer` token to the Go API, and the API verifies the signature against the project's JWKS.

## Local development

Requires Node 20+ and a running [Klyvi API](https://github.com/jacobkly/klyvi) at `http://localhost:8080`.

```bash
npm install
cp .env.example .env.local
# fill NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

In the Supabase project, add `http://localhost:4729` to **Auth → URL Configuration** (Site URL and Redirect URLs). Email + password auth is enabled by default.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
