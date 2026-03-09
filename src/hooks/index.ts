import { useMemo } from "react"
import { useSuiClient } from "@mysten/dapp-kit"
import { bcs } from "@mysten/sui/bcs"
import { SuiObjectResponse } from "@mysten/sui/jsonRpc"
import { Transaction } from "@mysten/sui/transactions"
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import BigNumber from "bignumber.js"
// Full lodash import required for _.chain() usage
import _ from "lodash"

import {
  OperatorMetadataWithId,
  OperatorWithSharesAndBaseApy,
  PoolOperator,
} from "@/types/operator"
import { walrus } from "@/config/walrus"
import { env } from "@/env.mjs"
import {
  batchGetObject,
  recursiveGetDynamicFields,
  recursiveGetMultiObjects,
  recursiveGetOwnedObjects,
  suiClient,
} from "@/services/client"
import {
  DelegationResponse,
  DelegatorResponse,
  OperatorTransaction,
  OperatorTransactionResponse,
  StakedWal,
  StakedWalWithStatus,
} from "@/types"

export const useSystemInner = <D = SuiObjectResponse>(
  props: Partial<UseQueryOptions<SuiObjectResponse, Error, D>> = {}
) => {
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
    ...props,
  })
}

export const useSystem = () => {
  const data = useSystemInner()
  return useMemo(() => {
    if (!data.data) return null
    const content = (data.data?.data?.content as any).fields.value.fields
    return {
      epoch: content.committee.fields.epoch as number,
      nShards: content.committee.fields.n_shards as number,
      storagePrice: parseFloat(content.storage_price_per_unit_size),
      writePrice: parseFloat(content.write_price_per_unit_size),
      totalCapacityTB: new BigNumber(content.total_capacity_size)
        .shiftedBy(-12)
        .toNumber(),
      usedCapacityTB: new BigNumber(content.used_capacity_size)
        .shiftedBy(-12)
        .toNumber(),
    }
  }, [data.data])
}

export const useStakingInner = <D = SuiObjectResponse>(
  props: Partial<UseQueryOptions<SuiObjectResponse, Error, D>> = {}
) => {
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
    ...props,
  })
}

export const useStaking = () => {
  const data = useStakingInner()
  return useMemo(() => {
    if (!data.data) return null
    const content = (data.data?.data?.content as any).fields.value.fields
    const changeDoneMs = content.epoch_state.fields.pos0
      ? parseFloat(content.epoch_state.fields.pos0)
      : Date.now()
    const duration = parseFloat(content.epoch_duration)
    return {
      epoch: content.epoch as number,
      epochDurationMs: duration,
      firstEpochStartMs: parseFloat(content.first_epoch_start),
      epochChangeDoneMs: changeDoneMs,
      nShards: content.n_shards as number,
      isAfterMidpoint: changeDoneMs + duration / 2 < Date.now(),
    }
  }, [data.data])
}

export const usePoolOperators = (
  props: Partial<UseQueryOptions<PoolOperator[], Error>> = {}
) => {
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
          const rewardsPool = new BigNumber(content.fields.rewards_pool)
            .shiftedBy(-walrus.decimals)
            .toNumber()
          const commissionReceiver =
            content.fields.commission_receiver.fields?.pos0
          const governaceAuthorized =
            content.fields.governance_authorized.fields?.pos0
          const storagePrice = parseFloat(
            content.fields.voting_params.fields.storage_price
          )
          const writePrice = parseFloat(
            content.fields.voting_params.fields.write_price
          )
          const state = content.fields.state.variant
          const commission = new BigNumber(content.fields.commission)
            .shiftedBy(-walrus.decimals)
            .toNumber()
          const pendingSharesWithdraw = _.reduce(
            content.fields.pending_shares_withdraw.fields.pos0.fields.contents,
            (acc, item) => {
              return acc.plus(item.fields.value)
            },
            new BigNumber(0)
          )
            .shiftedBy(-walrus.decimals)
            .toNumber()
          const pendingStake = _.reduce(
            content.fields.pending_stake.fields.pos0.fields.contents,
            (acc, item) => {
              return acc.plus(item.fields.value)
            },
            new BigNumber(0)
          )
            .shiftedBy(-walrus.decimals)
            .toNumber()
          const preActiveWithdrawals = _.reduce(
            content.fields.pre_active_withdrawals.fields.pos0.fields.contents,
            (acc, item) => {
              return acc.plus(item.fields.value)
            },
            new BigNumber(0)
          )
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
            rewardsPool,
            commissionReceiver,
            governaceAuthorized,
            storagePrice,
            writePrice,
            state,
            commission,
            pendingSharesWithdraw,
            pendingStake,
            preActiveWithdrawals,
          }
        })
      )
    },
    throwOnError: true,
    ...props,
  })
}

export const useOperatorsWithSharesAndBaseApy = (
  props: Partial<UseQueryOptions<OperatorWithSharesAndBaseApy[], Error>> = {}
) => {
  const poolOperators = usePoolOperators()
  const stakingInner = useStakingInner()
  const systemInner = useSystemInner()

  return useQuery({
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
    ...props,
  })
}

export const useOperatorWithSharesAndBaseApy = ({ id }: { id: string }) => {
  const operatorsWithSharesAndBaseApy = useOperatorsWithSharesAndBaseApy()
  return useMemo(() => {
    return operatorsWithSharesAndBaseApy.data?.find((o) => o.id === id) || null
  }, [operatorsWithSharesAndBaseApy.data, id])
}

export const useFullOperators = () => {
  const operatorsWithSharesAndBaseApy = useOperatorsWithSharesAndBaseApy()
  const operatorMetadatas = useOperatorMetadatas()

  return useMemo(() => {
    return operatorsWithSharesAndBaseApy.data?.map((o) => ({
      ...o,
      metadata: operatorMetadatas.data?.[o.id],
    })) as OperatorWithSharesAndBaseApy[] | undefined
  }, [operatorsWithSharesAndBaseApy.data, operatorMetadatas.data])
}

export const useStakedWal = ({
  address,
}: { address?: string } & Partial<
  UseQueryOptions<StakedWal[], Error>
> = {}) => {
  return useQuery({
    queryKey: ["staked-wal", address],
    queryFn: async () => {
      if (!address) return null
      const staked = await recursiveGetOwnedObjects({
        owner: address,
        filter: {
          StructType: walrus.stakedWal,
        },
      })
      return staked.map((s) => {
        const content = s.data?.content as any
        return {
          activationEpoch: content.fields.activation_epoch,
          nodeId: content.fields.node_id,
          id: s.data?.objectId!,
          rawAmount: content.fields.principal,
          amount: new BigNumber(content.fields.principal)
            .shiftedBy(-walrus.decimals)
            .toNumber(),
          withdrawEpoch:
            content.fields.state.fields.withdraw_epoch || undefined,
          type: content.fields.state.variant.toLowerCase() as
            | "staked"
            | "withdrawing",
        }
      }) satisfies StakedWal[]
    },
  })
}

export const useStakedWalWithStatus = ({ address }: { address?: string }) => {
  const stakedWal = useStakedWal({ address })
  const staking = useStaking()

  return useMemo(() => {
    if (!stakedWal.data || !staking) return null
    return stakedWal.data.map((s) => ({
      ...s,
      status: s.withdrawEpoch
        ? s.withdrawEpoch <= staking.epoch
          ? "claimable"
          : "withdrawing"
        : "staked",
      canWithdrawRightNow:
        s.withdrawEpoch <= staking.epoch
          ? true
          : s.activationEpoch > staking.epoch + 1 ||
              (s.activationEpoch === staking.epoch + 1 &&
                !staking.isAfterMidpoint)
            ? true
            : false,
      withdrawToEpoch:
        s.withdrawEpoch || staking.isAfterMidpoint
          ? staking.epoch + 2
          : staking.epoch + 1,
    })) satisfies StakedWalWithStatus[]
  }, [stakedWal.data, staking])
}

export const useOperatorMetadatas = <D = _.Dictionary<OperatorMetadataWithId>>(
  props: Partial<
    UseQueryOptions<_.Dictionary<OperatorMetadataWithId>, Error, D>
  > = {}
) => {
  return useQuery({
    staleTime: Infinity,
    queryKey: ["operator-metadatas"],
    queryFn: async () => {
      return await fetch(`${env.NEXT_PUBLIC_API_URL}/api/profiles`)
        .then((res) => res.json())
        .then((data) => _.keyBy(data.operators, "id"))
    },
    ...props,
  })
}

export const useEstimatedReward = ({
  address,
  stakedWals,
}: {
  address?: string
  stakedWals?: StakedWalWithStatus[] | null
}) => {
  const nodeIds = useMemo(() => {
    return stakedWals?.map((s) => s.nodeId).sort() || []
  }, [stakedWals])

  const data = useQuery({
    queryKey: ["estimated-reward", address, nodeIds] as const,
    enabled: !!stakedWals && !!address,
    queryFn: async () => {
      if (!stakedWals || !address)
        return {
          total: 0,
          rewards: {},
        }
      const tx = new Transaction()
      stakedWals.forEach((s) => {
        tx.moveCall({
          package: walrus.walrus,
          module: "staking",
          function: "calculate_rewards",
          arguments: [
            tx.object(walrus.staking),
            tx.pure.id(s.nodeId),
            tx.pure.u64(s.rawAmount),
            tx.pure.u32(s.activationEpoch),
            tx.pure.u32(s.withdrawToEpoch),
          ],
        })
      })
      const result = await suiClient.devInspectTransactionBlock({
        sender: address,
        transactionBlock: tx,
      })
      const rewards = _.reduce(
        result.results,
        (acc, result, i) => {
          const positionId = stakedWals[i].id
          const value = result.returnValues?.[0]?.[0]
          if (!value) return acc
          return {
            ...acc,
            [positionId]: new BigNumber(bcs.u64().parse(new Uint8Array(value)))
              .shiftedBy(-walrus.decimals)
              .toNumber(),
          }
        },
        {} as Record<string, number>
      )
      const total = _.chain(rewards).values().sum().value()
      return {
        total,
        rewards,
      }
    },
  })

  return data.data ?? null
}

export const useDelegators = <T = DelegatorResponse>({
  operatorId,
  pageIndex = 0,
  ...props
}: {
  operatorId: string
  pageIndex?: number
} & Partial<UseQueryOptions<DelegatorResponse, Error, T>>) => {
  return useQuery({
    queryKey: ["delegators", operatorId, pageIndex],
    staleTime: Infinity,
    queryFn: async () => {
      const delegators = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/delegators/${operatorId}/${pageIndex}`
      )
      return delegators.json()
    },
    ...props,
  })
}

export const useDelegations = <T = DelegationResponse>({
  operatorId,
  pageIndex = 0,
  ...props
}: {
  operatorId: string
  pageIndex?: number
} & Partial<UseQueryOptions<DelegationResponse, Error, T>>) => {
  return useQuery({
    queryKey: ["delegations", operatorId, pageIndex],
    staleTime: Infinity,
    queryFn: async () => {
      const delegations = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/delegations/${operatorId}/${pageIndex}`
      )
      return delegations.json()
    },
    ...props,
  })
}

export const useOperatorTransactions = ({
  operatorId,
}: {
  operatorId: string
}) => {
  return useInfiniteQuery<OperatorTransactionResponse>({
    queryKey: ["operator-transactions", operatorId],
    getNextPageParam: (lastPage) => {
      return lastPage.pageInfo.startCursor || undefined
    },
    initialPageParam: null,
    queryFn: async ({ pageParam = null }) => {
      const transactions = await fetch(
        "https://graphql.mainnet.sui.io/graphql",
        {
          method: "POST",
          body: JSON.stringify({
            query: `
query Transactions($operatorId: String, $last: Int, $before: String) {
  transactions(
    filter: {
      affectedObject: $operatorId,
    }
    last: $last
    before: $before
  ) {
    pageInfo {
      startCursor
    }
    nodes {
      digest
      kind {
        ... on ProgrammableTransaction {
           commands {
            nodes {
              ... on MoveCallCommand {
                function {
                  name
                  module {
                    name
                  }
                }
              }
            }
          }
        }
      }
      sender {
        address
        defaultSuinsName
      }
      effects {
        status
        gasEffects {
          gasSummary {
            computationCost
            storageCost
            storageRebate
            nonRefundableStorageFee
          }
        }
        timestamp
      }
    }
  }
}
          `,
            variables: {
              operatorId,
              last: 20,
              before: pageParam,
            },
          }),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          return {
            pageInfo: data.data.transactions.pageInfo,
            transactions: data.data.transactions.nodes.map((node: any) => {
              const firstTx = _.findLast(
                node.kind.commands.nodes,
                (t) => "function" in t
              )

              return {
                digest: node.digest,
                sender: node.sender.address,
                name: node.sender.defaultSuinsName,
                txLabel: firstTx?.function.name,
                txCount: node.kind.commands.nodes.length,
                timestamp: node.effects.timestamp,
                gas:
                  parseFloat(
                    node.effects.gasEffects.gasSummary.computationCost
                  ) +
                  parseFloat(node.effects.gasEffects.gasSummary.storageCost) +
                  parseFloat(node.effects.gasEffects.gasSummary.storageRebate) +
                  parseFloat(
                    node.effects.gasEffects.gasSummary.nonRefundableStorageFee
                  ),
                status: node.effects.status,
              }
            }),
          }
        })
      return transactions
    },
  })
}
