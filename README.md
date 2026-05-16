# Klyvi Web

Next.js frontend for **Klyvi**, a personalized movie and TV discovery app that helps you find what to watch next based on your taste.

This repo is the web client only. The Go API lives in [klyvi](https://github/jacobkly/klyvi) and owns all recommendation and ranking logic, so the web app stays a thin, fast client.

## Status

Early development. Setup and usage instructions will be added once there's something to run.

## Planned Stack

- [Next.js](https://nextjs.org/) + [React](https://react.dev/)
- TypeScript
- [Supabase JS](https://supabase.com/docs/reference/javascript) for auth (sign-in/session only; the access token is forwarded to the Go API, which verifies it)
- Hosted on Vercel

## Scope

The client handles rendering, interaction capture (rate/log/dismiss/save), and auth. It does not talk to the database directly. Catalog, search, interactions, and recommendations all go through the Klyvi API. Nothing about scoring or personalization lives here.

Stay tuned for updates!