import { eq } from "drizzle-orm"
import _ from "lodash"

import { dayjs } from "../../src/lib/dayjs"
import {
  aggregatedDaily,
  auditLog,
  operatorDaily,
} from "../../src/lib/db/schema"
import { db } from "../db"
import {
  buildNotes,
  buildReferenceQuery,
  SOURCE_FOR_METRIC,
} from "./audit-queries"
import { computeDailyMetrics, Fees, getFees } from "./backfill-compute"

interface AuditRow {
  timestamp: Date
  checkpoint: number | null
  metric: string
  frostlyticsValue: number | null
  referenceValue: number | null
  delta: number | null
  deltaPct: number | null
  source: string
  referenceQuery: string
  notes: string | null
}

const computeDiff = (
  f: number | null | undefined,
  r: number | null | undefined
) => {
  if (f == null || r == null) return { delta: null, deltaPct: null }
  const delta = f - r
  const denom = Math.abs(r) || Math.abs(f) || 1
  const deltaPct = (delta / denom) * 100
  return { delta, deltaPct }
}

const buildRow = (
  metric: string,
  frostlyticsValue: number | null,
  referenceValue: number | null,
  date: dayjs.Dayjs,
  checkpoint: number,
  operatorId?: string
): AuditRow => {
  const sourceKey = SOURCE_FOR_METRIC(metric)
  const { delta, deltaPct } = computeDiff(frostlyticsValue, referenceValue)
  const ctx = {
    metric,
    checkpoint: sourceKey === "defillama:walrus-protocol" ? null : checkpoint,
    date: date.format("YYYY-MM-DD"),
    operatorId,
  }
  return {
    timestamp: date.toDate(),
    checkpoint: ctx.checkpoint,
    metric,
    frostlyticsValue,
    referenceValue,
    delta,
    deltaPct,
    source: sourceKey,
    referenceQuery: buildReferenceQuery(ctx),
    notes: buildNotes(ctx),
  }
}

export interface RunAuditResult {
  rowsWritten: number
  skipped?: string
}

export async function runAuditForDate(
  date: dayjs.Dayjs,
  fees?: Fees
): Promise<RunAuditResult> {
  const dateDate = date.toDate()

  const [dbAgg] = await db
    .select()
    .from(aggregatedDaily)
    .where(eq(aggregatedDaily.timestamp, dateDate))
    .limit(1)

  if (!dbAgg) {
    return { rowsWritten: 0, skipped: "no aggregated_daily row" }
  }

  const dbOperators = await db
    .select()
    .from(operatorDaily)
    .where(eq(operatorDaily.timestamp, dateDate))

  const reference = await computeDailyMetrics(date, fees, {
    checkpoint: dbAgg.sequenceNumber,
  })
  if (!reference) {
    return { rowsWritten: 0, skipped: "computeDailyMetrics returned null" }
  }

  const checkpoint = dbAgg.sequenceNumber
  const rows: AuditRow[] = []

  const networkMetrics: Array<[string, number | null, number | null]> = [
    ["operatorCount", dbAgg.operatorCount, reference.operatorCount],
    ["activeCount", dbAgg.activeCount, reference.activeCount],
    ["committeeCount", dbAgg.committeeCount, reference.committeeCount],
    ["nShard", dbAgg.nShard, reference.nShard],
    ["totalStakedWAL", dbAgg.totalStakedWAL, reference.totalStakedWAL],
    ["averageStakedWAL", dbAgg.averageStakedWAL, reference.averageStakedWAL],
    ["storageUsageTB", dbAgg.storageUsageTB, reference.storageUsageTB],
    ["totalStorageTB", dbAgg.totalStorageTB, reference.totalStorageTB],
    ["storagePrice", dbAgg.storagePrice, reference.storagePrice],
    ["writePrice", dbAgg.writePrice, reference.writePrice],
    ["paidFeesUSD", dbAgg.paidFeesUSD, reference.paidFeesUSD],
  ]

  for (const [metric, fVal, rVal] of networkMetrics) {
    rows.push(buildRow(metric, fVal, rVal, date, checkpoint))
  }

  const referenceById = _.keyBy(reference.uniqueNodeIds, "id")
  const dbById = _.keyBy(dbOperators, "operatorId")
  const allOpIds = _.uniq([
    ..._.map(reference.uniqueNodeIds, "id"),
    ..._.map(dbOperators, "operatorId"),
  ])

  for (const opId of allOpIds) {
    const ref = referenceById[opId]
    const dbOp = dbById[opId]

    rows.push(
      buildRow(
        "per_operator.stakedWAL",
        dbOp?.stakedWAL ?? null,
        ref?.stakedWal ?? null,
        date,
        checkpoint,
        opId
      )
    )
    rows.push(
      buildRow(
        "per_operator.weight",
        dbOp?.weight ?? null,
        ref?.weight ?? null,
        date,
        checkpoint,
        opId
      )
    )
    rows.push(
      buildRow(
        "per_operator.weightPercentage",
        dbOp?.weightPercentage ?? null,
        ref?.weightPercentage ?? null,
        date,
        checkpoint,
        opId
      )
    )
  }

  if (rows.length > 0) {
    for (const chunk of _.chunk(rows, 500)) {
      await db.insert(auditLog).values(chunk)
    }
  }

  return { rowsWritten: rows.length }
}

export async function runAuditWindow(
  fees?: Fees,
  opts?: { days?: number }
): Promise<{ daysAudited: number; rowsWritten: number }> {
  const days = opts?.days ?? 7
  const resolvedFees = fees ?? (await getFees())
  const dates = _.range(days).map((i) =>
    dayjs
      .utc()
      .subtract(i + 1, "day")
      .startOf("day")
  )

  let daysAudited = 0
  let rowsWritten = 0
  for (const date of dates) {
    try {
      const result = await runAuditForDate(date, resolvedFees)
      if (result.rowsWritten > 0) {
        daysAudited++
        rowsWritten += result.rowsWritten
        console.log(
          `audited day ${date.format("YYYY-MM-DD")}: ${result.rowsWritten} rows`
        )
      } else if (result.skipped) {
        console.log(
          `skipped day ${date.format("YYYY-MM-DD")}: ${result.skipped}`
        )
      }
    } catch (err) {
      console.error(
        `audit failed for ${date.format("YYYY-MM-DD")}:`,
        (err as Error).message
      )
    }
  }
  return { daysAudited, rowsWritten }
}
