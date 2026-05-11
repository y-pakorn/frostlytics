import { Elysia, t } from "elysia"
import { asc } from "drizzle-orm"
import memoizee from "memoizee"

import {
  aggregatedDaily,
  grossProtocolRevenue,
  operatorDaily,
} from "../../src/lib/db/schema"
import { db } from "../db"

type DailyRow = {
  timestamp: string
  epoch: number | null
  activeCount: number | null
  committeeCount: number | null
  operatorCount: number | null
  totalStakedWAL: number | null
  averageStakedWAL: number | null
  storageUsedTB: number | null
  totalStorageTB: number | null
  storagePrice: number | null
  writePrice: number | null
  paidFeesUSD: number | null
}

type RevenueRow = {
  timestamp: string
  fromEpoch: number
  toEpoch: number
  grossInflowWAL: number
  userFeeWAL: number | null
  fixedRateSubsidyWAL: number | null
  usageSubsidyWAL: number | null
  poolFundingWAL: number | null
  poolDrainWAL: number | null
}

type MoverEntry = {
  operatorId: string
  currentWeightPct: number
  weightPctChange: number
}

type Movers = {
  gainers: MoverEntry[]
  losers: MoverEntry[]
}

type DecentralizationRow = {
  timestamp: string
  operatorCount: number
  nakamoto33: number
  top5Share: number
  top10Share: number
  activeStakedWAL: number
  gini: number
}

type ChurnRow = {
  epoch: number
  timestamp: string
  joined: number
  exited: number
  joinedIds: string[]
  exitedIds: string[]
  activeOperators: number
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

const computeNakamoto = (sortedPercentages: number[], threshold: number) => {
  let acc = 0
  for (let i = 0; i < sortedPercentages.length; i++) {
    acc += sortedPercentages[i]
    if (acc >= threshold) return i + 1
  }
  return sortedPercentages.length
}

// Gini coefficient (0 = perfectly equal, 1 = perfectly unequal).
const computeGini = (values: number[]) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((a, b) => a + b, 0) / n
  if (mean === 0) return 0
  let num = 0
  for (let i = 0; i < n; i++) num += (2 * (i + 1) - n - 1) * sorted[i]
  return num / (n * n * mean)
}

const _getProtocolHealth = async () => {
  const [dailyRows, revenueRows, operatorRows] = await Promise.all([
    db
      .select()
      .from(aggregatedDaily)
      .orderBy(asc(aggregatedDaily.timestamp)),
    db
      .select()
      .from(grossProtocolRevenue)
      .orderBy(asc(grossProtocolRevenue.timestamp)),
    db
      .select()
      .from(operatorDaily)
      .orderBy(asc(operatorDaily.timestamp)),
  ])

  const daily: DailyRow[] = dailyRows.map((d) => ({
    timestamp: d.timestamp.toISOString(),
    epoch: d.epoch,
    activeCount: d.activeCount,
    committeeCount: d.committeeCount,
    operatorCount: d.operatorCount,
    totalStakedWAL: d.totalStakedWAL,
    averageStakedWAL: d.averageStakedWAL,
    storageUsedTB: d.storageUsageTB,
    totalStorageTB: d.totalStorageTB,
    storagePrice: d.storagePrice,
    writePrice: d.writePrice,
    paidFeesUSD: d.paidFeesUSD,
  }))

  const revenue: RevenueRow[] = revenueRows.map((r) => ({
    timestamp: r.timestamp.toISOString(),
    fromEpoch: r.fromEpoch,
    toEpoch: r.toEpoch,
    grossInflowWAL: r.grossInflowWAL,
    userFeeWAL: r.userFeeWAL,
    fixedRateSubsidyWAL: r.fixedRateSubsidyWAL,
    usageSubsidyWAL: r.usageSubsidyWAL,
    poolFundingWAL: r.poolFundingWAL,
    poolDrainWAL: r.poolDrainWAL,
  }))

  // Group operator_daily by day → decentralization metrics.
  const byDay = new Map<
    string,
    {
      timestamp: string
      weights: number[]
      stakes: number[]
      ids: string[]
    }
  >()
  for (const row of operatorRows) {
    if (row.weightPercentage == null) continue
    const key = dayKey(row.timestamp)
    let bucket = byDay.get(key)
    if (!bucket) {
      bucket = {
        timestamp: row.timestamp.toISOString(),
        weights: [],
        stakes: [],
        ids: [],
      }
      byDay.set(key, bucket)
    }
    bucket.weights.push(row.weightPercentage)
    bucket.stakes.push(row.stakedWAL ?? 0)
    bucket.ids.push(row.operatorId)
  }

  const decentralization: DecentralizationRow[] = Array.from(byDay.values())
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((bucket) => {
      const sorted = [...bucket.weights].sort((a, b) => b - a)
      const sum = sorted.reduce((acc, w) => acc + w, 0)
      // weight_percentage is stored as a fraction of total weight; we
      // normalize to a 0–1 share to make Nakamoto/top-N robust regardless
      // of whether the column is on the 0–1 or 0–100 scale.
      const shares = sum > 0 ? sorted.map((w) => w / sum) : sorted
      const top5Share = shares.slice(0, 5).reduce((acc, w) => acc + w, 0)
      const top10Share = shares.slice(0, 10).reduce((acc, w) => acc + w, 0)
      const nakamoto33 = computeNakamoto(shares, 0.33)
      const activeStakedWAL = bucket.stakes.reduce((a, b) => a + b, 0)
      const gini = computeGini(bucket.weights)
      return {
        timestamp: bucket.timestamp,
        operatorCount: bucket.weights.length,
        nakamoto33,
        top5Share,
        top10Share,
        activeStakedWAL,
        gini,
      }
    })

  // Group operator_daily by epoch → churn (joined / exited diff vs prior epoch).
  const byEpoch = new Map<
    number,
    { timestamp: string; ids: Set<string> }
  >()
  for (const row of operatorRows) {
    if (row.epoch == null) continue
    let bucket = byEpoch.get(row.epoch)
    if (!bucket) {
      bucket = { timestamp: row.timestamp.toISOString(), ids: new Set() }
      byEpoch.set(row.epoch, bucket)
    } else if (row.timestamp.toISOString() < bucket.timestamp) {
      bucket.timestamp = row.timestamp.toISOString()
    }
    bucket.ids.add(row.operatorId)
  }

  const epochsSorted = Array.from(byEpoch.entries()).sort(
    (a, b) => a[0] - b[0]
  )
  const churn: ChurnRow[] = []
  let prevIds: Set<string> | null = null
  for (const [epoch, bucket] of epochsSorted) {
    const joinedIds = prevIds
      ? Array.from(bucket.ids).filter((id) => !prevIds!.has(id))
      : []
    const exitedIds = prevIds
      ? Array.from(prevIds).filter((id) => !bucket.ids.has(id))
      : []
    churn.push({
      epoch,
      timestamp: bucket.timestamp,
      joined: joinedIds.length,
      exited: exitedIds.length,
      joinedIds,
      exitedIds,
      activeOperators: bucket.ids.size,
    })
    prevIds = bucket.ids
  }

  // Movers & Shakers: per-operator weight_percentage change over last ~30 epochs.
  // Re-iterate operatorRows organized by operator, finding their latest and
  // ~30-epoch-ago weight_percentage values.
  const perOp = new Map<
    string,
    Array<{ epoch: number; weightPct: number }>
  >()
  for (const row of operatorRows) {
    if (row.epoch == null || row.weightPercentage == null) continue
    let arr = perOp.get(row.operatorId)
    if (!arr) {
      arr = []
      perOp.set(row.operatorId, arr)
    }
    arr.push({ epoch: row.epoch, weightPct: row.weightPercentage })
  }
  const moverEntries: MoverEntry[] = []
  perOp.forEach((points, operatorId) => {
    if (points.length === 0) return
    points.sort((a, b) => a.epoch - b.epoch)
    const latest = points[points.length - 1]
    // Pick a baseline ~30 epochs back (or earliest available if shorter).
    const baselineEpoch = latest.epoch - 30
    let baseline = points[0]
    for (const p of points) {
      if (p.epoch <= baselineEpoch) baseline = p
      else break
    }
    moverEntries.push({
      operatorId,
      currentWeightPct: latest.weightPct,
      weightPctChange: latest.weightPct - baseline.weightPct,
    })
  })
  const sortedByDelta = [...moverEntries].sort(
    (a, b) => b.weightPctChange - a.weightPctChange
  )
  const movers: Movers = {
    gainers: sortedByDelta.slice(0, 3),
    losers: sortedByDelta.slice(-3).reverse(),
  }

  return { daily, revenue, decentralization, churn, movers }
}

const getProtocolHealth = memoizee(_getProtocolHealth, {
  promise: true,
  maxAge: 3_600_000, // 1h
})

export const protocolHealthRoutes = new Elysia({
  tags: ["Protocol Health"],
}).get(
  "/api/protocol-health",
  async () => {
    return await getProtocolHealth()
  },
  {
    detail: {
      summary: "Get protocol-health metrics (network, economics, tokenomics, decentralization)",
      description:
        "Returns four parallel datasets used by the Protocol Health page: daily aggregated network snapshots, per-epoch protocol revenue, daily decentralization metrics (Nakamoto-33, top-5/10 share) derived from per-operator weight, and per-epoch operator churn (joined/exited IDs). Cached 1h.",
    },
    response: {
      200: t.Object({
        daily: t.Array(
          t.Object({
            timestamp: t.String({ format: "date-time" }),
            epoch: t.Union([t.Number(), t.Null()]),
            activeCount: t.Union([t.Number(), t.Null()]),
            committeeCount: t.Union([t.Number(), t.Null()]),
            operatorCount: t.Union([t.Number(), t.Null()]),
            totalStakedWAL: t.Union([t.Number(), t.Null()]),
            averageStakedWAL: t.Union([t.Number(), t.Null()]),
            storageUsedTB: t.Union([t.Number(), t.Null()]),
            totalStorageTB: t.Union([t.Number(), t.Null()]),
            storagePrice: t.Union([t.Number(), t.Null()]),
            writePrice: t.Union([t.Number(), t.Null()]),
            paidFeesUSD: t.Union([t.Number(), t.Null()]),
          })
        ),
        revenue: t.Array(
          t.Object({
            timestamp: t.String({ format: "date-time" }),
            fromEpoch: t.Number(),
            toEpoch: t.Number(),
            grossInflowWAL: t.Number(),
            userFeeWAL: t.Union([t.Number(), t.Null()]),
            fixedRateSubsidyWAL: t.Union([t.Number(), t.Null()]),
            usageSubsidyWAL: t.Union([t.Number(), t.Null()]),
            poolFundingWAL: t.Union([t.Number(), t.Null()]),
            poolDrainWAL: t.Union([t.Number(), t.Null()]),
          })
        ),
        decentralization: t.Array(
          t.Object({
            timestamp: t.String({ format: "date-time" }),
            operatorCount: t.Number(),
            nakamoto33: t.Number(),
            top5Share: t.Number(),
            top10Share: t.Number(),
            activeStakedWAL: t.Number(),
            gini: t.Number(),
          })
        ),
        churn: t.Array(
          t.Object({
            epoch: t.Number(),
            timestamp: t.String({ format: "date-time" }),
            joined: t.Number(),
            exited: t.Number(),
            joinedIds: t.Array(t.String()),
            exitedIds: t.Array(t.String()),
            activeOperators: t.Number(),
          })
        ),
        movers: t.Object({
          gainers: t.Array(
            t.Object({
              operatorId: t.String(),
              currentWeightPct: t.Number(),
              weightPctChange: t.Number(),
            })
          ),
          losers: t.Array(
            t.Object({
              operatorId: t.String(),
              currentWeightPct: t.Number(),
              weightPctChange: t.Number(),
            })
          ),
        }),
      }),
    },
  }
)
