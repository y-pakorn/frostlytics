import { Elysia } from "elysia"
import { and, desc, gte, lte } from "drizzle-orm"

import { backfillLog } from "../../src/lib/db/schema"
import { db } from "../db"

export const backfillLogsRoutes = new Elysia().get(
  "/api/backfill-logs",
  async ({ query }) => {
    const { format, from, to, limit: limitStr } = query

    const conditions = []
    if (from) conditions.push(gte(backfillLog.targetDate, new Date(from)))
    if (to) conditions.push(lte(backfillLog.targetDate, new Date(to)))

    const rows = await db
      .select()
      .from(backfillLog)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(backfillLog.targetDate))
      .limit(parseInt(limitStr || "200"))

    if (format === "csv") {
      const header =
        "id,target_date,status,duration_ms,epoch,operators_ingested,total_staked_wal,storage_usage_tb,total_storage_tb,storage_price,write_price,paid_fees_usd,error,created_at"
      const lines = rows.map((r) => {
        const d = r.rawData as Record<string, any> | null
        return [
          r.id,
          r.targetDate.toISOString(),
          r.status,
          r.durationMs,
          d?.epoch ?? "",
          d?.operatorsIngested ?? "",
          d?.totalStakedWAL ?? "",
          d?.storageUsageTB ?? "",
          d?.totalStorageTB ?? "",
          d?.storagePrice ?? "",
          d?.writePrice ?? "",
          d?.paidFeesUSD ?? "",
          r.error ? `"${r.error.replace(/"/g, '""')}"` : "",
          r.createdAt.toISOString(),
        ].join(",")
      })
      return new Response([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv" },
      })
    }

    return rows.map((r) => ({
      id: r.id,
      targetDate: r.targetDate.toISOString(),
      status: r.status,
      durationMs: r.durationMs,
      rawData: r.rawData,
      error: r.error,
      createdAt: r.createdAt.toISOString(),
    }))
  }
)
