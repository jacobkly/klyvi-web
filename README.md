# Klyvi Web

Next.js frontend for **Klyvi**, a personalized movie and TV discovery app that learns your taste and helps you find what to watch next.

This repo is the web client only. The Go API lives in [klyvi](https://github.com/jacobkly/klyvi) and owns all recommendation and ranking logic, so the web app stays a thin, fast client.

## Status

Clean slate. This is a fresh Next.js scaffold for a deliberately designed frontend. The original vibe-coded beta UI, which proved the backend end-to-end (auth, catalog, search, tracking, onboarding, personalized feed), is archived under [`beta-ui/`](beta-ui/) for reference.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- TypeScript (strict)
- [Tailwind CSS v4](https://tailwindcss.com/)
- ESLint

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

## Beta UI archive

The previous beta interface lives in [`beta-ui/`](beta-ui/) as a self-contained Next.js app with its own `package.json`, dependencies, and config. It is kept for reference while the new frontend is built.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
