import BigNumber from "bignumber.js"
import { and, eq, gte, lte, sql } from "drizzle-orm"
import _ from "lodash"

import { walrus } from "../../src/config/walrus"
import { dayjs } from "../../src/lib/dayjs"
import { aggregatedDaily, grossProtocolRevenue } from "../../src/lib/db/schema"
import { db } from "../db"
import { findCheckpointBefore, getObjectStateAt } from "./backfill-compute"

interface RingSlot {
  epoch: number | string
  rewards_to_distribute: string
  used_capacity: string
}

interface AlreadySubsidizedSlot {
  epoch: number | string
  balance: string
}

interface SystemInnerSnapshot {
  epoch: number
  ringBuffer: RingSlot[]
}

interface SubsidiesInnerSnapshot {
  pool: BigNumber
  systemSubsidyRate: BigNumber // basis points; 80000 = 800%
  alreadySubsidized: AlreadySubsidizedSlot[]
}

// HUNDRED_PERCENT in walrus_subsidies_inner.move (= basis-point denominator).
const HUNDRED_PERCENT = new BigNumber(10000)

export interface DailyRevenue {
  timestamp: Date
  fromCheckpoint: number
  toCheckpoint: number
  fromEpoch: number
  toEpoch: number
  grossInflowWAL: number
  // Nullable: walrus_subsidies wasn't deployed at mainnet launch, so older
  // checkpoints have no subsidies snapshot.
  poolDrainWAL: number | null
  poolFundingWAL: number | null
  fixedRateSubsidyWAL: number | null
  usageSubsidyWAL: number | null
  userFeeWAL: number | null
}

const toWAL = (frost: BigNumber): number =>
  frost.shiftedBy(-walrus.decimals).toNumber()

const fetchSystemInnerAt = async (
  checkpoint: number
): Promise<SystemInnerSnapshot | null> => {
  const si = (
    await getObjectStateAt(
      walrus.backfill.systemInner,
      checkpoint,
      "::SystemStateInner"
    )
  )?.value as any
  if (!si) return null

  const ringBuffer = si.future_accounting?.ring_buffer as RingSlot[] | undefined
  const epoch = si.committee?.epoch
  if (!ringBuffer || epoch == null) return null

  return {
    epoch: Number(epoch),
    ringBuffer,
  }
}

const fetchSubsidiesInnerAt = async (
  checkpoint: number
): Promise<SubsidiesInnerSnapshot | null> => {
  const si = (
    await getObjectStateAt(
      walrus.backfill.subsidiesInner,
      checkpoint,
      "::WalrusSubsidiesInnerV1"
    )
  )?.value as any
  if (!si) return null

  const pool = si.subsidy_pool
  const rate = si.system_subsidy_rate
  const alreadySubsidized = si.already_subsidized_balances?.ring_buffer as
    | AlreadySubsidizedSlot[]
    | undefined
  if (pool == null || rate == null || !alreadySubsidized) return null

  return {
    pool: new BigNumber(pool),
    systemSubsidyRate: new BigNumber(rate),
    alreadySubsidized,
  }
}

// Sums epoch-by-epoch rewards_to_distribute deltas, matched by `epoch` so the
// graduated slot at epoch tick correctly drops out of the diff.
const diffRewardsRingBuffer = (
  a: SystemInnerSnapshot,
  b: SystemInnerSnapshot
): BigNumber => {
  const aMap = _.fromPairs(
    a.ringBuffer.map((s) => [Number(s.epoch), new BigNumber(s.rewards_to_distribute)])
  ) as Record<number, BigNumber>
  let total = new BigNumber(0)
  for (const slot of b.ringBuffer) {
    const epoch = Number(slot.epoch)
    const curr = new BigNumber(slot.rewards_to_distribute)
    const prev = aMap[epoch] ?? new BigNumber(0)
    total = total.plus(curr.minus(prev))
  }
  return total
}

// Same matching-by-epoch diff over `already_subsidized_balances.ring_buffer`.
// `liveEpochs` = epochs present in the system's ring buffer at TO. We exclude
// subsidies-side slots whose epoch isn't live in the system anymore: those
// are graduated slots whose subsidy got paid out via advance_epoch's node
// distribution path, NOT into the ring buffer that we're measuring with
// `gross_inflow`. (Happens when process_subsidies fires BEFORE advance_epoch
// in the same day — the subsidies ring doesn't rotate until the next
// process_usage_subsidies call.)
const diffAlreadySubsidized = (
  a: SubsidiesInnerSnapshot,
  b: SubsidiesInnerSnapshot,
  liveEpochs: Set<number>
): BigNumber => {
  const aMap = _.fromPairs(
    a.alreadySubsidized.map((s) => [Number(s.epoch), new BigNumber(s.balance)])
  ) as Record<number, BigNumber>
  let total = new BigNumber(0)
  for (const slot of b.alreadySubsidized) {
    const epoch = Number(slot.epoch)
    if (!liveEpochs.has(epoch)) continue
    const curr = new BigNumber(slot.balance)
    const prev = aMap[epoch] ?? new BigNumber(0)
    total = total.plus(curr.minus(prev))
  }
  return total
}

export const computeDailyRevenue = async (
  date: dayjs.Dayjs,
  opts?: { fromCheckpoint?: number; toCheckpoint?: number }
): Promise<DailyRevenue | null> => {
  if (!date.isBefore(dayjs.utc().startOf("day"))) return null

  const startMs = date.valueOf()
  const endMs = date.add(1, "day").valueOf()

  const fromCheckpoint =
    opts?.fromCheckpoint ?? (await findCheckpointBefore(startMs))
  const toCheckpoint = opts?.toCheckpoint ?? (await findCheckpointBefore(endMs))

  const [sysA, sysB, subA, subB] = await Promise.all([
    fetchSystemInnerAt(fromCheckpoint),
    fetchSystemInnerAt(toCheckpoint),
    fetchSubsidiesInnerAt(fromCheckpoint),
    fetchSubsidiesInnerAt(toCheckpoint),
  ])
  if (!sysA || !sysB) return null

  const grossInflow = diffRewardsRingBuffer(sysA, sysB)

  let poolDrainWAL: number | null = null
  let poolFundingWAL: number | null = null
  let fixedRateSubsidyWAL: number | null = null
  let usageSubsidyWAL: number | null = null
  let userFeeWAL: number | null = null

  if (subA && subB) {
    const poolDelta = subA.pool.minus(subB.pool)
    const drain = poolDelta.isPositive() ? poolDelta : new BigNumber(0)
    const funding = poolDelta.isNegative() ? poolDelta.negated() : new BigNumber(0)

    // Exact usage_subsidy from the contract math (walrus_subsidies_inner.move:178-203):
    //   subsidy_added[e] = (rewards_at_call - already_subsidized_before) × rate
    //   already_subsidized_after = rewards_at_call + subsidy_added
    // ⇒ Δ_already_subsidized = to_subsidize × (1 + rate)
    // ⇒ subsidy_added = Δ_already_subsidized × rate / (1 + rate)
    //                 = Δ_already_subsidized × rate / (HUNDRED_PERCENT + rate)
    // Restrict to epochs still live in the system ring buffer at TO so we
    // don't count subsidies into already-graduated slots (which were paid out
    // to nodes via advance_epoch, not retained in the ring buffer).
    const liveEpochs = new Set(sysB.ringBuffer.map((s) => Number(s.epoch)))
    const deltaAS = diffAlreadySubsidized(subA, subB, liveEpochs)
    const rate = subA.systemSubsidyRate
    const usage = deltaAS
      .multipliedBy(rate)
      .dividedBy(HUNDRED_PERCENT.plus(rate))
    // Whatever slice of pool drain didn't go into the ring buffer is the
    // committee-commission part (process_fixed_rate_subsidies → staking).
    const fixedRate = BigNumber.maximum(0, drain.minus(usage))
    const userFee = grossInflow.minus(usage)

    poolDrainWAL = toWAL(drain)
    poolFundingWAL = toWAL(funding)
    fixedRateSubsidyWAL = toWAL(fixedRate)
    usageSubsidyWAL = toWAL(usage)
    userFeeWAL = toWAL(userFee)
  } else {
    // Pre-walrus_subsidies deployment: no subsidies were running, so gross is
    // already user fees (modulo any legacy `subsidies` package contributions —
    // out of scope).
    userFeeWAL = toWAL(grossInflow)
  }

  return {
    timestamp: date.toDate(),
    fromCheckpoint,
    toCheckpoint,
    fromEpoch: sysA.epoch,
    toEpoch: sysB.epoch,
    grossInflowWAL: toWAL(grossInflow),
    poolDrainWAL,
    poolFundingWAL,
    fixedRateSubsidyWAL,
    usageSubsidyWAL,
    userFeeWAL,
  }
}

export interface RunRevenueResult {
  daysComputed: number
  daysSkipped: number
  daysFailed: number
}

export const runRevenueBackfill = async (opts?: {
  days?: number
  force?: boolean
}): Promise<RunRevenueResult> => {
  const days = opts?.days ?? 31
  const force = opts?.force ?? false

  // Newest -> oldest so useful recent days fill first; if the run is interrupted
  // the latest data is already persisted. Day-boundary contiguity is still
  // guaranteed because both endpoints come from the same aggregated_daily map.
  const dates = _.range(days).map((i) =>
    dayjs
      .utc()
      .subtract(i + 1, "day")
      .startOf("day")
  )

  // Pull canonical day-boundary checkpoints from aggregated_daily so revenue
  // matches the same checkpoint references the rest of the dashboard uses.
  // We need date-1 too (for the oldest day's from_checkpoint).
  const earliest = _.last(dates)!.subtract(1, "day").toDate()
  const latest = dates[0].toDate()
  const aggRows = await db
    .select({
      timestamp: aggregatedDaily.timestamp,
      sequenceNumber: aggregatedDaily.sequenceNumber,
    })
    .from(aggregatedDaily)
    .where(
      and(
        gte(aggregatedDaily.timestamp, earliest),
        lte(aggregatedDaily.timestamp, latest)
      )
    )
  const aggByDate: Record<string, number> = _.fromPairs(
    aggRows.map((r) => [
      dayjs.utc(r.timestamp).format("YYYY-MM-DD"),
      r.sequenceNumber,
    ])
  )

  let daysComputed = 0
  let daysSkipped = 0
  let daysFailed = 0

  for (const date of dates) {
    const dateStr = date.format("YYYY-MM-DD")
    const prevDateStr = date.subtract(1, "day").format("YYYY-MM-DD")
    try {
      if (!force) {
        const [existing] = await db
          .select({ id: grossProtocolRevenue.id })
          .from(grossProtocolRevenue)
          .where(eq(grossProtocolRevenue.timestamp, date.toDate()))
          .limit(1)
        if (existing) {
          daysSkipped++
          continue
        }
      }

      // Both endpoints come from aggregated_daily so day N's from_checkpoint
      // is the same value as day N-1's to_checkpoint by construction.
      // findCheckpointBefore is only a fallback for boundary dates outside
      // aggregated_daily's window.
      const toCheckpoint =
        aggByDate[dateStr] ??
        (await findCheckpointBefore(date.add(1, "day").valueOf()))
      const fromCheckpoint =
        aggByDate[prevDateStr] ??
        (await findCheckpointBefore(date.valueOf()))

      const result = await computeDailyRevenue(date, {
        fromCheckpoint,
        toCheckpoint,
      })
      if (!result) {
        console.log(
          `skipped ${dateStr}: systemInner not available, fromCheckpoint=${fromCheckpoint}, toCheckpoint=${toCheckpoint}`
        )
        daysSkipped++
        continue
      }

      const values = {
        timestamp: result.timestamp,
        fromCheckpoint: result.fromCheckpoint,
        toCheckpoint: result.toCheckpoint,
        fromEpoch: result.fromEpoch,
        toEpoch: result.toEpoch,
        grossInflowWAL: result.grossInflowWAL,
        poolDrainWAL: result.poolDrainWAL,
        poolFundingWAL: result.poolFundingWAL,
        fixedRateSubsidyWAL: result.fixedRateSubsidyWAL,
        usageSubsidyWAL: result.usageSubsidyWAL,
        userFeeWAL: result.userFeeWAL,
      }

      if (force) {
        await db
          .insert(grossProtocolRevenue)
          .values(values)
          .onConflictDoUpdate({
            target: grossProtocolRevenue.timestamp,
            set: {
              fromCheckpoint: sql`excluded.from_checkpoint`,
              toCheckpoint: sql`excluded.to_checkpoint`,
              fromEpoch: sql`excluded.from_epoch`,
              toEpoch: sql`excluded.to_epoch`,
              grossInflowWAL: sql`excluded.gross_inflow_wal`,
              poolDrainWAL: sql`excluded.pool_drain_wal`,
              poolFundingWAL: sql`excluded.pool_funding_wal`,
              fixedRateSubsidyWAL: sql`excluded.fixed_rate_subsidy_wal`,
              usageSubsidyWAL: sql`excluded.usage_subsidy_wal`,
              userFeeWAL: sql`excluded.user_fee_wal`,
            },
          })
      } else {
        await db
          .insert(grossProtocolRevenue)
          .values(values)
          .onConflictDoNothing()
      }

      const feeMsg =
        result.userFeeWAL != null
          ? `, fee ${result.userFeeWAL.toFixed(4)} WAL`
          : ""
      console.log(
        `computed ${dateStr}: epoch ${result.fromEpoch}→${result.toEpoch}, ` +
          `gross ${result.grossInflowWAL.toFixed(4)} WAL${feeMsg}`
      )
      daysComputed++
    } catch (err) {
      console.error(`revenue failed for ${dateStr}:`, (err as Error).message)
      daysFailed++
    }
  }

  return { daysComputed, daysSkipped, daysFailed }
}
