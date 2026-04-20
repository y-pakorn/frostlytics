import { and, desc, gte, lte } from "drizzle-orm"
import { Elysia, t } from "elysia"

import { backfillLog } from "../../src/lib/db/schema"
import { db } from "../db"

export const backfillLogsRoutes = new Elysia({ tags: ["Backfill Logs"] }).get(
  "/api/backfill-logs",
  async ({ query }) => {
    const { from, to, limit: limitStr } = query

    const conditions = []
    if (from) conditions.push(gte(backfillLog.targetDate, new Date(from)))
    if (to) conditions.push(lte(backfillLog.targetDate, new Date(to)))

    const rows = await db
      .select()
      .from(backfillLog)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(backfillLog.targetDate))
      .limit(parseInt(limitStr || "200"))

    return rows.map((r) => ({
      id: r.id,
      targetDate: r.targetDate.toISOString(),
      status: r.status as "success" | "failure" | "skipped",
      durationMs: r.durationMs,
      checkpoint: r.checkpoint,
      epoch: r.epoch,
      rawData: r.rawData as {
        epoch: number
        sequenceNumber: number
        activeCount: number
        committeeCount: number
        operatorCount: number
        nShard: number
        totalStakedWAL: number
        averageStakedWAL: number
        storageUsageTB: number
        totalStorageTB: number
        storagePrice: number
        writePrice: number
        paidFeesUSD: number
        operatorsIngested: number
        operatorIds: string[]
      } | null,
      error: r.error,
      createdAt: r.createdAt.toISOString(),
    }))
  },
  {
    query: t.Object({
      from: t.Optional(
        t.String({
          format: "date",
          description:
            "Start date filter (inclusive). ISO 8601 date string, e.g. '2026-04-01'",
        })
      ),
      to: t.Optional(
        t.String({
          format: "date",
          description:
            "End date filter (inclusive). ISO 8601 date string, e.g. '2026-04-17'",
        })
      ),
      limit: t.Optional(
        t.String({
          description:
            "Maximum number of rows to return (default: 200). Covers ~200 days of logs.",
        })
      ),
    }),
    detail: {
      summary: "Get backfill ingestion logs",
      description:
        "Returns a log of every backfill pipeline execution, one entry per target date per run. Each log records whether the ingestion succeeded, failed, or was skipped (date already present), how long it took, and the raw aggregated data that was ingested. Use this endpoint to verify continuous data presence with no gaps and demonstrate pipeline stability over time. JSON array response; optional date range filtering.",
    },
    response: {
      200: t.Array(
        t.Object({
          id: t.Number({ description: "Auto-incrementing log entry ID" }),
          targetDate: t.String({
            format: "date-time",
            description: "The date that was being backfilled (ISO 8601 UTC)",
          }),
          status: t.Union(
            [t.Literal("success"), t.Literal("failure"), t.Literal("skipped")],
            {
              description:
                "Outcome of the backfill attempt. 'success' = data ingested, 'failure' = error occurred, 'skipped' = date already existed in DB",
            }
          ),
          durationMs: t.Number({
            description:
              "Wall-clock duration of this date's backfill in milliseconds",
          }),
          checkpoint: t.Union([t.Number(), t.Null()], {
            description:
              "Sui checkpoint sequence number used for this snapshot. Null for skipped/failed entries.",
          }),
          epoch: t.Union([t.Number(), t.Null()], {
            description:
              "Walrus protocol epoch number at the time of the snapshot. Null for skipped/failed entries.",
          }),
          rawData: t.Union(
            [
              t.Object({
                epoch: t.Number({
                  description: "Walrus protocol epoch number",
                }),
                sequenceNumber: t.Number({
                  description:
                    "Sui checkpoint sequence number used for this snapshot",
                }),
                activeCount: t.Number({
                  description: "Number of active nodes in the network",
                }),
                committeeCount: t.Number({
                  description: "Number of committee members",
                }),
                operatorCount: t.Number({
                  description: "Total number of staking pools/operators",
                }),
                nShard: t.Number({
                  description: "Number of shards in the committee",
                }),
                totalStakedWAL: t.Number({
                  description:
                    "Total WAL staked across the network (human-readable)",
                }),
                averageStakedWAL: t.Number({
                  description: "Average WAL staked per active node",
                }),
                storageUsageTB: t.Number({
                  description: "Used storage capacity in terabytes",
                }),
                totalStorageTB: t.Number({
                  description: "Total storage capacity in terabytes",
                }),
                storagePrice: t.Number({
                  description: "Storage price per unit size (on-chain units)",
                }),
                writePrice: t.Number({
                  description: "Write price per unit size (on-chain units)",
                }),
                paidFeesUSD: t.Number({
                  description: "Fees paid in USD for that day (from DefiLlama)",
                }),
                operatorsIngested: t.Number({
                  description: "Number of operator rows inserted for this date",
                }),
                operatorIds: t.Array(t.String(), {
                  description:
                    "List of operator node IDs (0x-prefixed) that were active",
                }),
              }),
              t.Null(),
            ],
            {
              description:
                "Aggregated network metrics snapshot captured during ingestion. Null for skipped/failed entries.",
            }
          ),
          error: t.Union([t.String(), t.Null()], {
            description:
              "Error message if status is 'failure', null otherwise. Truncated to 500 chars.",
          }),
          createdAt: t.String({
            format: "date-time",
            description:
              "Timestamp when this log entry was written (ISO 8601 UTC)",
          }),
        }),
        {
          description:
            "Array of backfill log entries, ordered by target date descending (most recent first)",
        }
      ),
    },
  }
)
