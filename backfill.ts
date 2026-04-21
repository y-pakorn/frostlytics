import "dotenv/config"

import { desc } from "drizzle-orm"
import _ from "lodash"
import { NIL, v5 as uuidv5 } from "uuid"

import { db } from "./server/db"
import { runAuditWindow } from "./server/services/audit-writer"
import {
  computeDailyMetrics,
  Fees,
  getFees,
} from "./server/services/backfill-compute"
import { dayjs } from "./src/lib/dayjs"
import {
  aggregatedDaily,
  backfillLog,
  operatorDaily,
} from "./src/lib/db/schema"

const backfillByDate = async (date: dayjs.Dayjs, fees?: Fees) => {
  const metrics = await computeDailyMetrics(date, fees)
  if (!metrics) return

  await db
    .insert(aggregatedDaily)
    .values({
      id: uuidv5(`${date.valueOf()}`, NIL),
      timestamp: date.toDate(),
      sequenceNumber: metrics.sequenceNumber,
      epoch: metrics.epoch,
      committeeCount: metrics.committeeCount,
      operatorCount: metrics.operatorCount,
      nShard: metrics.nShard,
      totalStakedWAL: metrics.totalStakedWAL,
      activeCount: metrics.activeCount,
      averageStakedWAL: metrics.averageStakedWAL,
      storageUsageTB: metrics.storageUsageTB,
      totalStorageTB: metrics.totalStorageTB,
      storagePrice: metrics.storagePrice,
      writePrice: metrics.writePrice,
      paidFeesUSD: metrics.paidFeesUSD,
    })
    .onConflictDoNothing()

  await db
    .insert(operatorDaily)
    .values(
      _.map(metrics.uniqueNodeIds, (m) => ({
        id: uuidv5(`${date.valueOf()}-${m.id}`, NIL),
        operatorId: m.id,
        timestamp: date.toDate(),
        epoch: metrics.epoch,
        stakedWAL: m.stakedWal,
        weight: m.weight,
        weightPercentage: m.weightPercentage,
      }))
    )
    .onConflictDoNothing()

  return {
    epoch: metrics.epoch,
    sequenceNumber: metrics.sequenceNumber,
    activeCount: metrics.activeCount,
    committeeCount: metrics.committeeCount,
    operatorCount: metrics.operatorCount,
    nShard: metrics.nShard,
    totalStakedWAL: metrics.totalStakedWAL,
    averageStakedWAL: metrics.averageStakedWAL,
    storageUsageTB: metrics.storageUsageTB,
    totalStorageTB: metrics.totalStorageTB,
    storagePrice: metrics.storagePrice,
    writePrice: metrics.writePrice,
    paidFeesUSD: metrics.paidFeesUSD,
    operatorsIngested: metrics.uniqueNodeIds.length,
    operatorIds: metrics.uniqueNodeIds.map((n) => n.id),
  }
}

async function main() {
  console.log("Starting backfill...")

  const latestDates = await db
    .select({
      timestamp: aggregatedDaily.timestamp,
    })
    .from(aggregatedDaily)
    .orderBy(desc(aggregatedDaily.timestamp))
    .limit(1)
  const latestTimestamp = latestDates?.[0]?.timestamp
  const latestDate = latestTimestamp ? dayjs.utc(latestTimestamp) : null

  const fees = await getFees()

  let filledCount = 0
  const dates = _.range(31).map((i) =>
    dayjs
      .utc()
      .subtract(i + 1, "day")
      .startOf("day")
  )
  for (const date of dates) {
    const startTime = Date.now()

    if (latestDate && (latestDate.isAfter(date) || latestDate.isSame(date))) {
      console.log("Already reached latest date, stopping")
      await db.insert(backfillLog).values({
        targetDate: date.toDate(),
        status: "skipped",
        durationMs: Date.now() - startTime,
        checkpoint: null,
        epoch: null,
      })
      break
    }

    console.log(`Backfilling ${date.format("YYYY-MM-DD")}`)
    try {
      const result = await backfillByDate(date, fees)
      const durationMs = Date.now() - startTime

      if (!result) {
        console.log("Failed to backfill, stopping")
        await db.insert(backfillLog).values({
          targetDate: date.toDate(),
          status: "failure",
          durationMs,
          checkpoint: null,
          epoch: null,
          error: "backfillByDate returned falsy",
        })
        break
      }

      await db.insert(backfillLog).values({
        targetDate: date.toDate(),
        status: "success",
        durationMs,
        checkpoint: result.sequenceNumber,
        epoch: result.epoch,
        rawData: result,
      })
      filledCount++
    } catch (err) {
      await db.insert(backfillLog).values({
        targetDate: date.toDate(),
        status: "failure",
        durationMs: Date.now() - startTime,
        checkpoint: null,
        epoch: null,
        error: String((err as Error).message).slice(0, 500),
      })
      break
    }
  }

  console.log(`Backfill complete. Filled ${filledCount} days.`)

  console.log("Running rolling 7-day audit...")
  try {
    const auditResult = await runAuditWindow(fees)
    console.log(
      `Audit complete. Audited ${auditResult.daysAudited} days, wrote ${auditResult.rowsWritten} audit_log rows.`
    )
  } catch (err) {
    console.error("Audit failed (non-fatal):", (err as Error).message)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("Backfill failed:", err)
  process.exit(1)
})
