import { Elysia, t } from "elysia"
import { and, asc, eq } from "drizzle-orm"
import memoizee from "memoizee"

import {
  grossProtocolRevenue,
  operatorDaily,
} from "../../src/lib/db/schema"
import { db } from "../db"

type HistoryRow = {
  timestamp: string
  epoch: number
  stakedWAL: number | null
  weight: number | null
  weightPercentage: number | null
  estimatedEarningsWAL: number | null
}

type OperatorHistoryResponse = {
  operatorId: string
  firstEpoch: number | null
  latestEpoch: number | null
  tenureEpochs: number
  history: HistoryRow[]
}

const _getOperatorHistory = async (
  operatorId: string
): Promise<OperatorHistoryResponse> => {
  const [rows, revRows] = await Promise.all([
    db
      .select()
      .from(operatorDaily)
      .where(eq(operatorDaily.operatorId, operatorId))
      .orderBy(asc(operatorDaily.timestamp)),
    db
      .select()
      .from(grossProtocolRevenue)
      .orderBy(asc(grossProtocolRevenue.timestamp)),
  ])

  // Aggregate user fees per epoch (revenue rows may be per-checkpoint).
  const userFeeByEpoch = new Map<number, number>()
  for (const r of revRows) {
    userFeeByEpoch.set(
      r.toEpoch,
      (userFeeByEpoch.get(r.toEpoch) ?? 0) + (r.userFeeWAL ?? 0)
    )
  }

  const history: HistoryRow[] = rows.map((d) => {
    const fees = d.epoch != null ? userFeeByEpoch.get(d.epoch) ?? 0 : 0
    const estimatedEarningsWAL =
      d.weightPercentage != null
        ? d.weightPercentage * fees
        : null
    return {
      timestamp: d.timestamp.toISOString(),
      epoch: d.epoch ?? 0,
      stakedWAL: d.stakedWAL,
      weight: d.weight,
      weightPercentage: d.weightPercentage,
      estimatedEarningsWAL,
    }
  })

  const epochs = history.map((h) => h.epoch).filter((e) => e > 0)
  const firstEpoch = epochs.length ? Math.min(...epochs) : null
  const latestEpoch = epochs.length ? Math.max(...epochs) : null
  const tenureEpochs =
    firstEpoch != null && latestEpoch != null
      ? latestEpoch - firstEpoch + 1
      : 0

  return {
    operatorId,
    firstEpoch,
    latestEpoch,
    tenureEpochs,
    history,
  }
}

const getOperatorHistory = memoizee(_getOperatorHistory, {
  promise: true,
  maxAge: 3_600_000, // 1h
  max: 500,
  normalizer: (args) => args[0],
})

export const operatorHistoryRoutes = new Elysia({
  tags: ["Operator History"],
}).get(
  "/api/operator-history",
  async ({ query }) => {
    return await getOperatorHistory(query.id)
  },
  {
    query: t.Object({
      id: t.String({ description: "Operator ID (0x-prefixed, 66 chars)" }),
    }),
    detail: {
      summary: "Per-operator history",
      description:
        "Returns the full history of a single operator: daily stake, weight, weight share, and estimated earnings per epoch (weight_percentage * user_fee_wal). Also returns tenure metadata (first/latest epoch, total epochs active). Cached 1h.",
    },
    response: {
      200: t.Object({
        operatorId: t.String(),
        firstEpoch: t.Union([t.Number(), t.Null()]),
        latestEpoch: t.Union([t.Number(), t.Null()]),
        tenureEpochs: t.Number(),
        history: t.Array(
          t.Object({
            timestamp: t.String({ format: "date-time" }),
            epoch: t.Number(),
            stakedWAL: t.Union([t.Number(), t.Null()]),
            weight: t.Union([t.Number(), t.Null()]),
            weightPercentage: t.Union([t.Number(), t.Null()]),
            estimatedEarningsWAL: t.Union([t.Number(), t.Null()]),
          })
        ),
      }),
    },
  }
)
