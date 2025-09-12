import { unstable_cache } from "next/cache"
import { asc } from "drizzle-orm"

import { db } from "@/lib/db"
import { aggregatedDaily } from "@/lib/db/schema"

import Home from "./home"

export const revalidate = false

const getHistoricalData = unstable_cache(
  async () => {
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
  },
  ["historical-data"],
  {
    revalidate: false,
  }
)

export default async function HomePage() {
  const historicalData = await getHistoricalData()
  return <Home historicalData={historicalData} />
}
