# Klyvi build status

All 8 surfaces shipped. Production build clean (9 static routes).

- ✅ Scaffold + design tokens (commit: a640fec)
- ✅ Surface 1 — Media Detail (commit: 63da116)
- ✅ Surface 2 — Home Feed (commit: 7066aba)
- ✅ Surface 3 — Search (commit: e34d848)
- ✅ Surface 4 — Season Detail (commit: 5bf789b)
- ✅ Surface 5 — Library (commit: e6899b6)
- ✅ Surface 6 — Onboarding (commit: ef46780)
- ✅ Surface 7 — Why This Rec (shipped with Surface 1, commit: 63da116)
- ✅ Surface 8 — Settings (commit: e8c556b)
- ✅ Polish pass — loading skeletons (in progress, this commit)

## Try it

```bash
npm install   # only if node_modules was wiped
npm run dev
```

Visit:
- `/` — home feed (Recommended for you)
- `/media/496243` — Parasite detail page (every id resolves here in beta)
- `/media/95396/season/2` — Severance season 2 (AniList-style)
- `/search` — search with recent + trending
- `/library` — tabbed watchlist (try `?tab=watching`)
- `/rate` — onboarding rapid-rate (under `(onboarding)` group)
- `/settings` — preferences (reduce motion toggle is live)
- `/signin` — auth stub
- `/anything-else` — the 404
