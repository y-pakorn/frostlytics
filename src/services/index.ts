import { cache } from "react"
import BigNumber from "bignumber.js"
import _ from "lodash"

import { walrus } from "@/config/walrus"

import {
  recursiveGetDynamicFields,
  recursiveGetMultiObjects,
  suiClient,
} from "./client"

export const getAllOperators = cache(async () => {
  const poolIds = await recursiveGetDynamicFields({
    parentId: walrus.poolTable,
  })
  const poolObjects = await recursiveGetMultiObjects({
    objectIds: poolIds.map((pool) => pool.objectId),
    options: {
      showContent: true,
    },
  })

  const pools = poolObjects.map((pool) => {
    const content = pool.data?.content as any

    const id = pool.data?.objectId!
    const name = content.fields.node_info.fields.name
    const metadataId = content.fields.node_info.fields.metadata.fields.id.id
    const address =
      content.fields.node_info.fields.network_address.split(":")[0]
    const staked = new BigNumber(content.fields.wal_balance)
      .shiftedBy(-9)
      .toNumber()
    const shares = new BigNumber(content.fields.num_shares)
      .shiftedBy(-9)
      .toNumber()
    const capacityTB = new BigNumber(
      content.fields.voting_params.fields.node_capacity
    )
      .shiftedBy(-12)
      .toNumber()
    const latestEpoch = content.fields.latest_epoch
    const activationEpoch = content.fields.activation_epoch
    const commissionRate = content.fields.commission_rate

    return {
      id,
      name,
      metadataId,
      address,
      staked,
      shares,
      capacityTB,
      latestEpoch,
      activationEpoch,
      commissionRate,
    }
  })

  return pools
})

export const getSharesAndBaseApy = cache(async () => {
  const system = await suiClient.getObject({
    id: walrus.systemInner,
    options: {
      showContent: true,
    },
  })
  const staking = await suiClient.getObject({
    id: walrus.stakingInner,
    options: {
      showContent: true,
    },
  })
  const stakingContent = staking.data?.content as any
  const content = system.data?.content as any
  const totalShares = _.sumBy(
    content.fields.value.fields.committee.fields.members,
    (m: any) => m.fields.weight as number
  )
  const operatorShares =
    content.fields.value.fields.committee.fields.members.map((m: any) => ({
      id: m.fields.node_id,
      weight: m.fields.weight,
      pct: m.fields.weight / totalShares,
    })) as { id: string; weight: number; pct: number }[]
  const sharesById = _.keyBy(operatorShares, "id")

  const index =
    content.fields.value.fields.future_accounting.fields.current_index
  const rewards = new BigNumber(
    content.fields.value.fields.future_accounting.fields.ring_buffer[
      index
    ].fields.rewards_to_distribute
  )
    .shiftedBy(-9)
    .toNumber()
  const epochStart = new BigNumber(
    stakingContent.fields.value.fields.epoch_state.fields.pos0
  ).toNumber()
  const elapsed = _.now() - epochStart
  const oneYear = 365 * 24 * 60 * 60 * 1000
  const yearlyReward = rewards * (oneYear / elapsed)

  const operators = await getAllOperators()
  const totalStaked = _.sumBy(operators, "staked")
  const baseApy = yearlyReward / totalStaked

  const operatorWithApy = operators.map((o) => {
    const share = sharesById[o.id]!
    if (!share) return null
    const yearlyRewardForOperator = share.pct * yearlyReward
    const apy = yearlyRewardForOperator / o.staked
    const apyWithCommission = apy * (1 - o.commissionRate / 10000)
    return {
      ...o,
      apy,
      apyWithCommission,
    }
  })

  console.log("totalStaked", totalStaked)
  console.log("baseApy", baseApy, `${baseApy * 100}%`)
  console.dir(operatorWithApy, { depth: null })
})
