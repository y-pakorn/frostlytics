import { graphql } from "@mysten/sui/graphql/schema"
import BigNumber from "bignumber.js"
import _ from "lodash"

import { walrus } from "../../src/config/walrus"
import { dayjs } from "../../src/lib/dayjs"
import { suiGraphQLClient } from "./client"

export interface Fees {
  lastFee: number
  feesArray: [number, number][]
  fees: Record<number, number>
}

export const getFees = async (): Promise<Fees> => {
  const data = (await fetch(
    "https://api.llama.fi/summary/fees/walrus-protocol",
    {
      cache: "no-store",
    }
  ).then((res) => res.json())) as any
  const fees = _.chain(data.totalDataChart)
    .map((e) => [e[0], e[1]] as [number, number])
    .value()
  return {
    lastFee: _.last(fees)?.[1] || 0,
    feesArray: fees,
    fees: _.fromPairs(fees),
  }
}

export const getTransactionAffectedObject = async (
  objectId: string,
  beforeCheckpoint?: number
) => {
  const query = graphql(`
    query getTransactionAffectedObject(
      $beforeCheckpoint: Int
      $objectId: String
    ) {
      transactions(
        filter: {
          affectedObject: $objectId
          beforeCheckpoint: $beforeCheckpoint
        }
        last: 1
      ) {
        nodes {
          digest
          effects {
            objectChanges {
              nodes {
                address
                outputState {
                  address
                  asMoveObject {
                    contents {
                      type {
                        repr
                      }
                      json
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `)

  const data = await suiGraphQLClient.query({
    query,
    variables: {
      beforeCheckpoint: beforeCheckpoint,
      objectId: objectId,
    },
  })
  const txs = data.data?.transactions as any
  return _.chain(txs?.nodes[0]?.effects?.objectChanges?.nodes)
    .map((o: any) => o.outputState?.asMoveObject?.contents)
    .compact()
    .map((o: any) => ({
      type: o.type.repr,
      ...o.json,
    }))
    .value()
}

// Direct object-state read at a given checkpoint. Doesn't depend on
// transaction effects retention, so it works for old checkpoints where the
// affecting tx has been pruned.
export const getObjectAtCheckpoint = async (
  objectId: string,
  atCheckpoint: number
): Promise<{ type: string; [k: string]: any } | null> => {
  const data = await suiGraphQLClient.query({
    query: graphql(`
      query getObjectAtCheckpoint(
        $objectId: SuiAddress!
        $atCheckpoint: Int
      ) {
        object(address: $objectId, atCheckpoint: $atCheckpoint) {
          asMoveObject {
            contents {
              type {
                repr
              }
              json
            }
          }
        }
      }
    `),
    variables: { objectId, atCheckpoint },
  })
  const contents = (data.data?.object as any)?.asMoveObject?.contents
  if (!contents) return null
  return { type: contents.type.repr, ...(contents.json as any) }
}

// Single-object read with primary (tx-effects) and fallback (atCheckpoint) paths.
// `typePattern` disambiguates when the affecting tx changed multiple objects.
export const getObjectStateAt = async (
  objectId: string,
  checkpoint: number,
  typePattern?: string
): Promise<{ type: string; [k: string]: any } | null> => {
  const affected = await getTransactionAffectedObject(objectId, checkpoint + 1)
  const primary = typePattern
    ? _.find(affected, (o: any) => o.type.includes(typePattern))
    : affected[0]
  if (primary) return primary as any

  const direct = await getObjectAtCheckpoint(objectId, checkpoint)
  if (!direct) return null
  if (typePattern && !direct.type?.includes?.(typePattern)) return null
  return direct
}

export const getCheckpoints = async (fromCheckpoint?: number) => {
  const data = await suiGraphQLClient.query({
    query: graphql(`
      query getCheckpoints($afterCheckpoint: Int) {
        checkpoints(last: 50, filter: { beforeCheckpoint: $afterCheckpoint }) {
          nodes {
            sequenceNumber
            timestamp
          }
        }
      }
    `),
    variables: {
      afterCheckpoint: fromCheckpoint,
    },
  })
  return data.data?.checkpoints?.nodes || []
}

export const findCheckpointBefore = async (
  timestampMs: number,
  fromCheckpoint?: number
): Promise<number> => {
  const checkpoints = await getCheckpoints(fromCheckpoint)
  const averageCheckpointPerSec = _.chain(checkpoints)
    .map((c, i, cs) =>
      i > 0
        ? dayjs(c.timestamp).diff(cs[i - 1]?.timestamp, "milliseconds")
        : null
    )
    .compact()
    .mean()
    .value()
  const checkpointCalculatedFromInterval =
    ((checkpoints[checkpoints.length - 1]?.sequenceNumber as number) || 0) -
    Math.floor(
      (dayjs(checkpoints[checkpoints.length - 1]?.timestamp).valueOf() -
        timestampMs) /
        averageCheckpointPerSec
    )

  const checkpointsAfter = await getCheckpoints(
    checkpointCalculatedFromInterval
  )
  const found = _.findLast(
    checkpointsAfter,
    (c) => dayjs(c.timestamp).valueOf() < timestampMs
  )
  if (found) {
    return found.sequenceNumber as number
  } else {
    return findCheckpointBefore(
      timestampMs,
      (_.last(checkpointsAfter)?.sequenceNumber as number) ||
        checkpointCalculatedFromInterval
    )
  }
}

export interface DailyMetrics {
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
  uniqueNodeIds: Array<{
    id: string
    weight: number
    stakedWal: number
    weightPercentage: number
  }>
}

export const computeDailyMetrics = async (
  date: dayjs.Dayjs,
  fees?: Fees,
  opts?: { checkpoint?: number }
): Promise<DailyMetrics | null> => {
  if (date.isAfter(dayjs.utc().startOf("day"))) {
    console.log("date is not ended yet")
    return null
  }
  const tmr = date.add(1, "day").valueOf()
  const checkpoint = opts?.checkpoint ?? (await findCheckpointBefore(tmr))
  const systemInner = (
    await getObjectStateAt(
      walrus.backfill.systemInner,
      checkpoint,
      "::SystemStateInner"
    )
  )?.value
  if (!systemInner) {
    console.log("systemInner not found")
    return null
  }
  const epoch = systemInner?.committee.epoch
  const committeeCount = systemInner?.committee.members.length
  const nShard = systemInner?.committee.n_shards
  const totalCapacityTB = new BigNumber(systemInner?.total_capacity_size)
    .shiftedBy(-12)
    .toNumber()
  const usedCapacityTB = new BigNumber(systemInner?.used_capacity_size)
    .shiftedBy(-12)
    .toNumber()
  const storagePrice = parseFloat(systemInner?.storage_price_per_unit_size)
  const writePrice = parseFloat(systemInner?.write_price_per_unit_size)

  const stakingInner = (
    await getObjectStateAt(
      walrus.backfill.stakingInner,
      checkpoint,
      "::StakingInner"
    )
  )?.value
  if (!stakingInner) {
    console.log("stakingInner not found")
    return null
  }
  const operatorCount = parseInt(stakingInner?.pools.size)

  const activeSet = (
    await getObjectStateAt(
      walrus.backfill.activeSet,
      checkpoint,
      "::ActiveSet"
    )
  )?.value
  if (!activeSet) {
    console.log("activeSet not found")
    return null
  }

  const totalStakedWAL = new BigNumber(activeSet?.total_stake)
    .shiftedBy(-walrus.decimals)
    .toNumber()
  const activeCount = activeSet?.nodes.length

  const weightMap = _.chain(systemInner?.committee.members)
    .map((m) => [m.node_id, m.weight])
    .fromPairs()
    .value()

  const stakedWalMap = _.chain(activeSet?.nodes)
    .map((m) => [m.node_id, m.staked_amount])
    .fromPairs()
    .value()

  const uniqueNodeIds = _.chain(systemInner?.committee.members)
    .concat(activeSet?.nodes)
    .map((m) => m?.node_id)
    .compact()
    .map((m) => ({
      id: m,
      weight: weightMap[m] ?? 0,
      stakedWal: new BigNumber(stakedWalMap[m])
        .shiftedBy(-walrus.decimals)
        .toNumber(),
      weightPercentage: (weightMap[m] ?? 0) / nShard,
    }))
    .compact()
    .uniq()
    .value()

  const feesUSD =
    fees?.fees[Math.floor(date.valueOf() / 1000)] || fees?.lastFee || 0

  return {
    epoch,
    sequenceNumber: checkpoint,
    activeCount,
    committeeCount,
    operatorCount,
    nShard,
    totalStakedWAL,
    averageStakedWAL: _.meanBy(uniqueNodeIds, "stakedWal"),
    storageUsageTB: usedCapacityTB,
    totalStorageTB: totalCapacityTB,
    storagePrice,
    writePrice,
    paidFeesUSD: feesUSD,
    uniqueNodeIds,
  }
}
