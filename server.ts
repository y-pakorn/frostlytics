import "dotenv/config"
import { node } from "@elysiajs/node"
import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"

import { profilesRoutes } from "./server/routes/profiles"
import { delegatorsRoutes } from "./server/routes/delegators"
import { delegationsRoutes } from "./server/routes/delegations"
import { historicalDataRoutes } from "./server/routes/historical-data"
import { ogRoutes } from "./server/routes/og"
import { sitemapRoutes } from "./server/routes/sitemap"

const port = process.env.PORT ?? 3001

const app = new Elysia({ adapter: node() })
  .use(cors())
  .use(profilesRoutes)
  .use(delegatorsRoutes)
  .use(delegationsRoutes)
  .use(historicalDataRoutes)
  .use(ogRoutes)
  .use(sitemapRoutes)
  .listen(port)

console.log(`Elysia server running at http://localhost:${port}`)

export type App = typeof app
