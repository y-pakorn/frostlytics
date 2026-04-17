import "dotenv/config"
import { node } from "@elysiajs/node"
import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"

import { backfillLogsRoutes } from "./server/routes/backfill-logs"
import { profilesRoutes } from "./server/routes/profiles"
import { delegatorsRoutes } from "./server/routes/delegators"
import { delegationsRoutes } from "./server/routes/delegations"
import { historicalDataRoutes } from "./server/routes/historical-data"
import { ogRoutes } from "./server/routes/og"
import { sitemapRoutes } from "./server/routes/sitemap"

const port = process.env.PORT ?? 3001

const app = new Elysia({ adapter: node() })
  .use(
    cors({
      origin: [
        "http://localhost:3000",
        "https://frostlytics.wal.app",
        "https://froslytics.wal.app",
      ],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Frostlytics API",
          version: "1.0.0",
          description:
            "Analytics API for the Walrus protocol on Sui blockchain. Provides operator profiles, delegation data, historical network metrics, backfill ingestion logs, and Open Graph image generation. All monetary amounts use WAL token (9 decimals). Sui addresses are 0x-prefixed, 66 characters.",
        },
        tags: [
          { name: "Operators", description: "Walrus network operator profiles and metadata" },
          { name: "Delegators", description: "Delegator listings per operator with Sui Name Service resolution" },
          { name: "Delegations", description: "Staking/unstaking event history per operator" },
          { name: "Historical Data", description: "Daily aggregated network snapshots from the backfill pipeline" },
          { name: "Backfill Logs", description: "Ingestion pipeline execution logs for auditing data continuity" },
          { name: "Open Graph Images", description: "Dynamic OG image generation for social media link previews" },
          { name: "SEO", description: "Search engine optimization resources (sitemap)" },
        ],
      },
    })
  )
  .use(backfillLogsRoutes)
  .use(profilesRoutes)
  .use(delegatorsRoutes)
  .use(delegationsRoutes)
  .use(historicalDataRoutes)
  .use(ogRoutes)
  .use(sitemapRoutes)
  .listen(port)

console.log(`Elysia server running at http://localhost:${port}`)

export type App = typeof app
