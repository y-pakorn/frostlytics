import { Elysia } from "elysia"
import { asc } from "drizzle-orm"
import memoizee from "memoizee"

import { aggregatedDaily } from "../../src/lib/db/schema"
import { db } from "../db"

const _getHistoricalData = async () => {
  return await db
    .select({
      timestamp: aggregatedDaily.timestamp,
      paidFeesUSD: aggregatedDaily.paidFeesUSD,
      totalStakedWAL: aggregatedDaily.totalStakedWAL,
      storageUsedTB: aggregatedDaily.storageUsageTB,
    })
    .from(aggregatedDaily)
    .orderBy(asc(aggregatedDaily.timestamp))
    .then((data) => {
      return data.map((d) => ({
        timestamp: d.timestamp.toISOString(),
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

export const historicalDataRoutes = new Elysia().get(
  "/api/historical-data",
  async () => {
    return await getHistoricalData()
  }
)
