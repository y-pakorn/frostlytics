import { Elysia, t } from "elysia"
import { asc } from "drizzle-orm"
import memoizee from "memoizee"

import { aggregatedDaily } from "../../src/lib/db/schema"
import { db } from "../db"

const _getHistoricalData = async () => {
  return await db
    .select({
      timestamp: aggregatedDaily.timestamp,
      sequenceNumber: aggregatedDaily.sequenceNumber,
      paidFeesUSD: aggregatedDaily.paidFeesUSD,
      totalStakedWAL: aggregatedDaily.totalStakedWAL,
      storageUsedTB: aggregatedDaily.storageUsageTB,
    })
    .from(aggregatedDaily)
    .orderBy(asc(aggregatedDaily.timestamp))
    .then((data) => {
      return data.map((d) => ({
        timestamp: d.timestamp.toISOString(),
        sequenceNumber: d.sequenceNumber,
        paidFeesUSD: d.paidFeesUSD,
        totalStakedWAL: d.totalStakedWAL,
        storageUsedTB: d.storageUsedTB,
      }))
    })
}

const getHistoricalData = memoizee(_getHistoricalData, {
  promise: true,
  maxAge: 3_600_000, // 1h
})

export const historicalDataRoutes = new Elysia({ tags: ["Historical Data"] }).get(
  "/api/historical-data",
  async () => {
    return await getHistoricalData()
  },
  {
    detail: {
      summary: "Get historical network data",
      description:
        "Returns daily aggregated snapshots of the Walrus network, ordered chronologically (oldest first). Each record represents one day and includes total WAL staked, storage usage, and fees paid. Data is populated by the backfill pipeline and cached for 1 hour. Useful for charting network growth over time.",
    },
    response: {
      200: t.Array(
        t.Object({
          timestamp: t.String({ format: "date-time", description: "ISO 8601 date-time for the start of the day (UTC)" }),
          sequenceNumber: t.Number({ description: "Sui checkpoint sequence number used by the backfill pipeline to snapshot this day's state" }),
          paidFeesUSD: t.Union([t.Number(), t.Null()], { description: "Total fees paid in USD for that day (from DefiLlama), null if unavailable" }),
          totalStakedWAL: t.Union([t.Number(), t.Null()], { description: "Total WAL tokens staked across the network (human-readable, not base units)" }),
          storageUsedTB: t.Union([t.Number(), t.Null()], { description: "Storage capacity used in terabytes" }),
        }),
        { description: "Array of daily network snapshots, ordered by date ascending" }
      ),
    },
  }
)
