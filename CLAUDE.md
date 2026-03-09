# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frostlytics — an analytics dashboard for the Walrus protocol on Sui blockchain. Built with Next.js 15 (static export), React 19, TypeScript, and Tailwind CSS 4. Hosted on Walrus (static files) with a separate Elysia API server.

## Architecture

Three independent runtimes:

1. **Static Next.js frontend** (`src/`) — `output: 'export'`, no server runtime. All pages are client components.
2. **Elysia API server** (`server/`, `server.ts`) — handles data fetching, caching, OG images, sitemap. Runs with `tsx` on Node.js using `@elysiajs/node` adapter.
3. **Backfill script** (`backfill.ts`) — standalone daily cron for DB population.

### Data Flow

Blockchain (Sui RPC / GraphQL) → Elysia API (`server/`) → React Query hooks (`src/hooks/`) → Components

External APIs: Blockberry (delegation history), DefiLlama (fee data), Sui Name Service (address resolution).

Database: Neon PostgreSQL via Drizzle ORM. Two tables — `aggregated_daily` (network snapshots) and `operatorDaily` (per-operator snapshots). Backfilled daily via `backfill.ts`.

### Key Directories

- `src/app/` — App Router pages (all client components, no API routes)
- `src/hooks/` — React Query hooks for all blockchain data (system state, staking, operators, delegators)
- `src/services/` — Sui client setup, batch schedulers (client-side only, no React `cache`)
- `src/components/ui/` — Radix UI-based component library (shadcn pattern)
- `src/config/` — Walrus contract addresses, site metadata, nav items, tier definitions
- `src/lib/` — Utilities (cn, formatter, dayjs, analytics, db schema)
- `server/` — Elysia API server (routes, services, db client)
- `server/routes/` — API route handlers (profiles, delegators, delegations, historical-data, og, sitemap)
- `server/services/` — Server-side Sui client and operator services with memoizee caching

### Routing

Uses search params instead of path params for dynamic pages (required for static export):
- `/operator?id=<address>&tab=<tab>` (not `/operator/[id]`)
- `/profile?addr=<address>` (not `/profile/[addr]`)

## Commands

```bash
pnpm dev              # Start Next.js dev server (Turbopack)
pnpm build            # Static export to out/
pnpm lint             # ESLint
pnpm format           # Prettier (write)
pnpm format:check     # Prettier (check only)
pnpm db:sync          # Generate + run Drizzle migrations
pnpm server           # Start Elysia dev server (tsx watch)
pnpm server:start     # Start Elysia production server
pnpm backfill         # Run backfill script
```

## Caching Strategy

### Server-side (Elysia — `memoizee`)
- 24h: Operator profiles (`preFetch: true`), operator metadata (max 500), SUI names (max 2000), OG images
- 1h: All operators, historical data, delegators (max 1000)
- 1m: Delegations (max 1000)
- Always use `promise: true` for async functions, `max` for dynamic keys

### Client-side (React Query)
- Global defaults: `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`
- `staleTime: Infinity`: historical-data, circulating supply (rarely changes)
- `staleTime: 30s`: prices
- Batch requests: `@yornaath/batshit` scheduler for efficient RPC calls

## Performance Patterns

- `React.lazy` + `Suspense` for operator tab components (delegators, delegations, transactions)
- `React.memo` on `SafeImage` with `loading="lazy"` and `decoding="async"`
- Lodash: use individual imports (`import range from "lodash/range"`) except where `_.chain()` is needed (requires full import)
- Eden Treaty (`@elysiajs/eden`) for type-safe API calls from `src/lib/api.ts`

## Walrus Protocol Integration

Contract addresses and constants in `src/config/walrus.ts`. WAL token uses 9 decimals. Minimum staking is 1 WAL. Staking/unstaking/withdrawal flows use `@mysten/walrus` SDK with transaction blocks signed via `@mysten/dapp-kit`.

## Environment Variables

Defined and validated with Zod in `src/env.mjs` (t3-oss/env-nextjs pattern).

Frontend: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GA_ID` (optional)

Server (`.env`, loaded via `dotenv`): `DATABASE_URL`, `BLOCKBERRY_API_KEY`, `PORT` (default 3001)

## TypeScript

Two tsconfigs:
- `tsconfig.json` — Next.js frontend (`src/`), excludes `server/**/*`, `server.ts`, `backfill.ts`
- `tsconfig.server.json` — Elysia server + backfill, targets ESNext/NodeNext, jsx: react-jsx

Shared code between server and frontend: `src/lib/db/schema.ts`, `src/config/walrus.ts`, `src/lib/utils.ts`, `src/types/`

## Styling

Dark mode only. Tailwind CSS 4 with `@theme` syntax and CSS custom properties in `src/styles/globals.css`. Uses `cn()` utility (clsx + tailwind-merge) for class composition.

## Path Alias

`@/*` maps to `src/*` (tsconfig paths).

## Analytics

Custom typed event tracking in `src/lib/analytic.ts` with Zod-validated events. Uses `sendGAEvent` from `@next/third-parties/google`. Optional Google Analytics via `NEXT_PUBLIC_GA_ID`.
