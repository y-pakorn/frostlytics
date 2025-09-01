import { useQuery } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import _ from "lodash"

import { OperatorWithSharesAndBaseApy, PoolOperator } from "@/types/operator"
import { walrus } from "@/config/walrus"
import {
  batchGetObject,
  recursiveGetDynamicFields,
  recursiveGetMultiObjects,
  suiClient,
} from "@/services/client"

export const useSystemInner = () => {
  return useQuery({
    staleTime: Infinity,
    queryKey: ["system-inner"],
    queryFn: async () => {
      const id = await suiClient
        .getDynamicFields({
          parentId: walrus.system,
        })
        .then((d) => d.data[0].objectId)
      return batchGetObject.fetch(id)
    },
  })
}

export const useStakingInner = () => {
  return useQuery({
    staleTime: Infinity,
    queryKey: ["staking-inner"],
    queryFn: async () => {
      const id = await suiClient
        .getDynamicFields({
          parentId: walrus.staking,
        })
        .then((d) => d.data[0].objectId)
      return batchGetObject.fetch(id)
    },
  })
}

export const usePoolOperators = () => {
  return useQuery<PoolOperator[]>({
    queryKey: ["pools"],
    queryFn: async () => {
      const poolIds = await recursiveGetDynamicFields({
        parentId: walrus.pool,
      })
      const poolObjects = await recursiveGetMultiObjects({
        objectIds: poolIds.map((pool) => pool.objectId),
        options: {
          showContent: true,
        },
      })
      return await Promise.all(
        poolObjects.map(async (pool) => {
          const content = pool.data?.content as any

          const id = pool.data?.objectId!
          const name = content.fields.node_info.fields.name
          const metadataId =
            content.fields.node_info.fields.metadata.fields.id.id
          const address =
            content.fields.node_info.fields.network_address.split(":")[0]
          const staked = new BigNumber(content.fields.wal_balance)
            .shiftedBy(-walrus.decimals)
            .toNumber()
          const shares = new BigNumber(content.fields.num_shares)
            .shiftedBy(-walrus.decimals)
            .toNumber()
          const capacityTB = new BigNumber(
            content.fields.voting_params.fields.node_capacity
          )
            .shiftedBy(-12)
            .toNumber()
          const latestEpoch = content.fields.latest_epoch
          const activationEpoch = content.fields.activation_epoch
          const commissionRate = content.fields.commission_rate / 10_000

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
      )
    },
  })
}

export const useOperatorsWithSharesAndBaseApy = () => {
  const poolOperators = usePoolOperators()
  const stakingInner = useStakingInner()
  const systemInner = useSystemInner()

  return useQuery<OperatorWithSharesAndBaseApy[]>({
    queryKey: ["operators-with-shares-and-base-apy"],
    enabled: !!poolOperators.data && !!stakingInner.data && !!systemInner.data,
    queryFn: async () => {
      if (!poolOperators.data || !stakingInner.data || !systemInner.data)
        return []

      const stakingContent = stakingInner.data.data?.content as any
      const systemContent = systemInner.data.data?.content as any

      const totalShares = _.sumBy(
        systemContent.fields.value.fields.committee.fields.members,
        (m: any) => m.fields.weight as number
      )
      const operatorShares =
        systemContent.fields.value.fields.committee.fields.members.map(
          (m: any) => ({
            id: m.fields.node_id,
            weight: m.fields.weight,
            pct: m.fields.weight / totalShares,
          })
        ) as { id: string; weight: number; pct: number }[]

      const sharesById = _.keyBy(operatorShares, "id")

      const index =
        systemContent.fields.value.fields.future_accounting.fields.current_index
      const rewards = new BigNumber(
        systemContent.fields.value.fields.future_accounting.fields.ring_buffer[
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

      const totalStaked = _.sumBy(poolOperators.data, "staked")

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

      const operatorsWithApy = _.chain(poolOperators.data)
        .map((o) => {
          const share = sharesById[o.id]!

          if (!share)
            return {
              ...o,
              isCommittee: false,
              isActive: false,
              apy: 0,
              apyWithCommission: 0,
              pct: 0,
              weight: 0,
            }

          // Calculate operator-specific epoch reward rate
          const operatorEpochRewardRate =
            (share.pct * fullEpochReward) / o.staked
          const rewardWithCommission =
            operatorEpochRewardRate * (1 - o.commissionRate)

          // Calculate APY with compounding for this operator
          const apy = Math.pow(1 + operatorEpochRewardRate, epochsPerYear) - 1
          const apyWithCommission =
            Math.pow(1 + rewardWithCommission, epochsPerYear) - 1

          // Calculate APR (simple interest) for this operator
          const apr = operatorEpochRewardRate * epochsPerYear
          const aprWithCommission = rewardWithCommission * epochsPerYear

          return {
            ...o,
            isCommittee: true,
            apy,
            apyWithCommission,
            pct: share.pct,
            weight: share.weight,
          }
        })
        .compact()
        .value()

      return operatorsWithApy
    },
  })
}
