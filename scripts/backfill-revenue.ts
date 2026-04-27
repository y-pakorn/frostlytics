import "dotenv/config"

import { runRevenueBackfill } from "../server/services/revenue-compute"

const args = process.argv.slice(2)
const daysArg = args.find((a) => a.startsWith("--days="))
const days = daysArg ? Number(daysArg.split("=")[1]) : 395
const force = args.includes("--force")

async function main() {
  if (!Number.isFinite(days) || days <= 0) {
    console.error(`invalid --days value: ${daysArg}`)
    process.exit(1)
  }

  console.log(
    `Starting revenue backfill (days=${days}${force ? ", force" : ""})...`
  )
  const result = await runRevenueBackfill({ days, force })
  console.log(
    `Revenue backfill complete. ` +
      `computed=${result.daysComputed}, ` +
      `skipped=${result.daysSkipped}, ` +
      `failed=${result.daysFailed}`
  )
  process.exit(0)
}

main().catch((err) => {
  console.error("Revenue backfill failed:", err)
  process.exit(1)
})
