import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { graphql } from "@mysten/sui/graphql/schemas/latest"
import BigNumber from "bignumber.js"
import { desc } from "drizzle-orm"
import { uuid } from "drizzle-orm/pg-core"
import _ from "lodash"
import { NIL, v5 as uuidv5 } from "uuid"

import { walrus } from "@/config/walrus"
import { dayjs } from "@/lib/dayjs"
import { db } from "@/lib/db"
import { aggregatedDaily, operatorDaily } from "@/lib/db/schema"
import { suiGraphQLClient } from "@/services/client"

const getFees = async () => {
  const data = await fetch(
    "https://api.llama.fi/summary/fees/walrus-protocol",
    {
      cache: "no-store",
    }
  ).then((res) => res.json())
  return _.chain(data.totalDataChart)
    .map((e) => [e[0], e[1]] as [number, number])
    .fromPairs()
    .value()
}

const getTransactionAffectedObject = async (
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

const getCheckpoints = async (fromCheckpoint?: number) => {
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
  return data.data?.checkpoints.nodes || []
}

const findCheckpointBefore = async (
  timestampMs: number,
  fromCheckpoint?: number
) => {
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

const backfillByDate = async (
  date: dayjs.Dayjs,
  fees?: Record<number, number>
) => {
  if (date.isAfter(dayjs.utc().startOf("day"))) {
    console.log("date is not ended yet")
    return
  }
  const tmr = date.add(1, "day").valueOf()
  const checkpoint = await findCheckpointBefore(tmr)
  const systemInnerEffected = await getTransactionAffectedObject(
    walrus.backfill.systemInner,
    checkpoint + 1
  )
  const systemInner = _.find(systemInnerEffected, (o) =>
    o.type.includes("::SystemStateInner")
  )?.value
  if (!systemInner) {
    console.log("systemInner not found")
    return
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

  const stakingInnerEffected = await getTransactionAffectedObject(
    walrus.backfill.stakingInner,
    checkpoint + 1
  )
  const stakingInner = _.find(stakingInnerEffected, (o) =>
    o.type.includes("::StakingInner")
  )?.value
  if (!stakingInner) {
    console.log("stakingInner not found")
    return
  }
  const operatorCount = parseInt(stakingInner?.pools.size)

  const activeSetEffected = await getTransactionAffectedObject(
    walrus.backfill.activeSet,
    checkpoint + 1
  )
  const activeSet = _.find(activeSetEffected, (o) =>
    o.type.includes("::ActiveSet")
  )?.value
  if (!activeSet) {
    console.log("activeSet not found")
    return
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

  const feesUSD = fees?.[Math.floor(date.valueOf() / 1000)]

  await db
    .insert(aggregatedDaily)
    .values({
      id: uuidv5(`${date.valueOf()}`, NIL),
      timestamp: date.toDate(),
      sequenceNumber: checkpoint,
      epoch,
      committeeCount,
      operatorCount,
      nShard,
      totalStakedWAL,
      activeCount,
      averageStakedWAL: _.meanBy(uniqueNodeIds, "stakedWal"),
      storageUsageTB: usedCapacityTB,
      totalStorageTB: totalCapacityTB,
      storagePrice,
      writePrice,
      paidFeesUSD: feesUSD,
    })
    .onConflictDoNothing()

  await db
    .insert(operatorDaily)
    .values(
      _.map(uniqueNodeIds, (m) => ({
        id: uuidv5(`${date.valueOf()}-${m.id}`, NIL),
        operatorId: m.id,
        timestamp: date.toDate(),
        epoch,
        stakedWAL: m.stakedWal,
        weight: m.weight,
        weightPercentage: m.weightPercentage,
      }))
    )
    .onConflictDoNothing()

  return true
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (
    process.env.MODE !== "development" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({
      message: "Unauthorized",
      status: 401,
    })
  }

  const latestDates = await db
    .select({
      timestamp: aggregatedDaily.timestamp,
    })
    .from(aggregatedDaily)
    .orderBy(desc(aggregatedDaily.timestamp))
    .limit(1)
  const latestTimestamp = latestDates?.[0]?.timestamp

  if (latestTimestamp) {
    const latestDate = dayjs.utc(latestTimestamp)
    const toBeBackfilled = dayjs.utc().startOf("day").subtract(1, "day")
    if (
      latestDate.isSame(toBeBackfilled) ||
      latestDate.isAfter(toBeBackfilled)
    ) {
      console.log(`Latest date is today or after today, stopping`)
      return NextResponse.json({
        message: "NO_ACTION_NEEDED",
      })
    }
    console.log(`Backfilling ${latestDate.format("YYYY-MM-DD")}`)
    const fees = await getFees()
    const result = await backfillByDate(toBeBackfilled, fees)
    if (!result) {
      console.log(`Failed to backfill, stopping`)
    }
  } else {
    const fees = await getFees()
    const dates = _.range(30).map((i) =>
      dayjs
        .utc()
        .subtract(i + 1, "day")
        .startOf("day")
    )
    for (const date of dates) {
      console.log(`Backfilling ${date.format("YYYY-MM-DD")}`)
      const result = await backfillByDate(date, fees)
      if (!result) {
        console.log(`Failed to backfill, stopping`)
        break
      }
    }
  }

  revalidateTag("historical-data")
  revalidatePath("/", "page")

  return NextResponse.json({
    message: "OK",
  })
}
