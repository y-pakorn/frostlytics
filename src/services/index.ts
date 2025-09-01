import { cache } from "react"
import { unstable_cache } from "next/cache"
import BigNumber from "bignumber.js"
import _ from "lodash"

import { walrus } from "@/config/walrus"

import {
  recursiveGetDynamicFields,
  recursiveGetMultiObjects,
  suiClient,
} from "./client"

export const getAllOperators = cache(async () => {
  const stakingInner = await suiClient
    .getDynamicFields({
      parentId: walrus.staking,
    })
    .then((d) => d.data[0].objectId)
  const staking = await suiClient.getObject({
    id: stakingInner,
    options: {
      showContent: true,
    },
  })

  const content = (staking.data?.content as any).fields.value.fields
  const committeeSet = new Set(
    content.committee.fields.pos0.fields.contents.map((c: any) => c.fields.key)
  )
  const poolTableId = content.pools.fields.id.id

  // const activeSetId = content.active_set.fields.id.id
  // const activeSet = await suiClient.getDynamicFields({
  //   parentId: activeSetId,
  // })
  // const activeSetInnerId = activeSet.data[0].objectId
  // const activeSetInner = await suiClient.getObject({
  //   id: activeSetInnerId,
  //   options: {
  //     showContent: true,
  //   },
  // })

  const poolIds = await recursiveGetDynamicFields({
    parentId: poolTableId,
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
    const isCommittee = committeeSet.has(id)

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
      isCommittee,
    }
  })

  return pools
})

export const getSharesAndBaseApy = cache(async () => {
  const systemInner = await suiClient
    .getDynamicFields({
      parentId: walrus.system,
    })
    .then((d) => d.data[0].objectId)
  const stakingInner = await suiClient
    .getDynamicFields({
      parentId: walrus.staking,
    })
    .then((d) => d.data[0].objectId)
  const system = await suiClient.getObject({
    id: systemInner,
    options: {
      showContent: true,
    },
  })
  const staking = await suiClient.getObject({
    id: stakingInner,
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
  const epochDuration = new BigNumber(
    stakingContent.fields.value.fields.epoch_duration
  ).toNumber() // in milliseconds
  const elapsed = _.now() - epochStart

  // Step 1: Interpolate the reward to be the reward for the full epoch
  const fullEpochReward = rewards * (epochDuration / elapsed)

  const operators = await getAllOperators()
  const totalStaked = _.sumBy(operators, "staked")

  // Calculate epoch reward rate (per epoch)
  const epochRewardRate = fullEpochReward / totalStaked

  // Step 2: Calculate number of epochs in a year
  const oneYear = 365 * 24 * 60 * 60 * 1000
  const epochsPerYear = oneYear / epochDuration

  // Step 3: Calculate APY with compounding every epoch
  // APY = (1 + r)^n - 1, where r is epoch reward rate and n is epochs per year
  const baseApy = Math.pow(1 + epochRewardRate, epochsPerYear) - 1

  // Step 4: Calculate raw APR (simple interest)
  const baseApr = epochRewardRate * epochsPerYear

  const operatorWithApy = _.chain(operators)
    .map((o) => {
      const share = sharesById[o.id]!
      if (!share) return null

      // Calculate operator-specific epoch reward rate
      const operatorEpochRewardRate = (share.pct * fullEpochReward) / o.staked

      // Calculate APY with compounding for this operator
      const apy = Math.pow(1 + operatorEpochRewardRate, epochsPerYear) - 1

      // Calculate APR (simple interest) for this operator
      const apr = operatorEpochRewardRate * epochsPerYear

      // Apply commission to both APY and APR
      const commissionMultiplier = 1 - o.commissionRate / 10000
      const apyWithCommission = (1 + apy) ** commissionMultiplier - 1
      const aprWithCommission = apr * commissionMultiplier

      return {
        ...o,
        apy,
        apr,
        apyWithCommission,
        aprWithCommission,
        pct: share.pct,
        weight: share.weight,
      }
    })
    .compact()
    .value()

  return {
    totalStaked,
    baseApy,
    baseApr,
    operatorWithApy,
  }
})

export const getSharesAndBaseApyCached = unstable_cache(
  getSharesAndBaseApy,
  ["shares-and-base-apy"],
  {
    revalidate: 86400, // 24 hours
  }
)

export const getAllOperatorsCached = unstable_cache(
  getAllOperators,
  ["all-operators"],
  {
    revalidate: 86400, // 24 hours
  }
)
