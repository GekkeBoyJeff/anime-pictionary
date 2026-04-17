# Anime Pictionary — Inspiratie-Engine

A stage tool for **AnimeCon 2026 · Hidden Spirits** pictionary rounds. One volunteer picks an anime, gets three drawable prompts, and draws under a 60-second timer while the audience guesses. The app exists because choosing on-stage under pressure is hard — swipe, tap, draw.

Built and maintained by the **Dutch Anime Community**.

## Stack

- **Vite 6** — dev server and static bundler.
- **React 19 (JSX)** — no TypeScript; JSDoc types where clarity helps.
- **Tailwind CSS v4** — design tokens in `src/index.css`, OKLCH colours, no config file.
- **Wouter** — tiny client-side router (sub-2 KB).
- **Supabase** (hybrid) — optional backend. Player flow is 100% static; only the `/admin` route and the `image-search` Edge Function talk to Supabase.

## Run it locally

```bash
npm install
cp .env.example .env            # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev                     # http://localhost:5173/
```

Useful scripts:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with HMR. |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Serve the built bundle locally (port 4173). |
| `npm run catalog` | Re-download the manami-project anime-offline-database and regenerate `public/anime-catalog.json`. Run this weekly to pick up new seasonal anime. |
| `npm run lint` | ESLint on the source tree. |

## Architecture

```
Player flow (/)                              Admin flow (/admin)
┌───────────────────┐                        ┌─────────────────────┐
│ Catalog JSON      │                        │  Supabase Auth      │
│ public/anime-     │◄────  merge  ────┐     │  (email+password)   │
│ catalog.json      │                  │     └──────────┬──────────┘
│  (30k entries,    │                  │                │
│   ~17 MB)         │                  │                ▼
└──────┬────────────┘                  │     ┌─────────────────────┐
       │ Random / search               │     │ custom_anime_hints  │
       ▼                               │     │ (Supabase Postgres) │
┌───────────────────┐                  │     └──────────┬──────────┘
│ Keuzescherm       │─┐                │                │
│ swipe + search    │ │                │                │
└───────────────────┘ │                │                │
       │              │                │                │
       ▼              │                │                │
┌───────────────────┐ │                │                │
│ Inspiratiescherm  │─┼── resolveHint ─┼────────────────┘
│ + gallery viewer  │ │
└───────────────────┘ │
       │              │                    ┌─────────────────────┐
       ▼              │                    │ Edge Function       │
┌───────────────────┐ │   ref images       │ image-search        │
│ Tekenscherm       │─┴───────────────────►│ (DuckDuckGo scrape) │
│ 60s timer + peek  │                      └─────────────────────┘
└───────────────────┘
```

The **player flow** is static. A game only needs the bundled catalog + bundled hints JS — it will work on a laptop that lost wifi mid-round.

The **admin flow** is a SPA that talks to Supabase client-side. Route guard is soft (client-side redirect); real security is Supabase RLS.

The **Edge Function** (`supabase/functions/image-search/`) scrapes DuckDuckGo for reference thumbnails. Runs on Supabase's free tier. If DDG blocks it, swap to Bing HTML scraping in that single file — the frontend contract stays the same.

## Where to edit hints

- **Permanent additions** — append to `src/data/custom-hints.js` and commit. Each entry is `{ mal_id, title, hints: [h1, h2, h3] }`.
- **Ad-hoc additions during an event** — log in at `/admin`, search the catalog, and fill in three hints. These land in Supabase and are merged on top of the baseline at runtime.

## Deployment — GitHub Pages

Pushing to `main` triggers `.github/workflows/deploy.yml` which builds and publishes to GitHub Pages.

Required repository secrets:

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Publishable anon key (`sb_publishable_…` format) |

The workflow sets `VITE_BASE=/<repo-name>/` automatically. If you move to a custom domain, override `VITE_BASE=/` in repo env settings.

## Known follow-ups

None blocking. Future ideas:

- Pre-baked reference images for the baseline 15 series so they load instantly, with the edge function as fallback for catalog randoms.
- Per-player history (prevent the same drawer seeing the same title twice in one session).
- Exportable score sheet for the presenter.
