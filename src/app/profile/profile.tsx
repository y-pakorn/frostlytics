"use client"

import { useEffect, useMemo } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import keyBy from "lodash/keyBy"
import last from "lodash/last"
import minBy from "lodash/minBy"
import sumBy from "lodash/sumBy"

import { tiers } from "@/config/tier"
import { track } from "@/lib/analytic"
import { useBalances } from "@/hooks/use-balances"
import {
  useEstimatedReward,
  useFullOperators,
  useStakedWalWithStatus,
  useStaking,
} from "@/hooks"

import { ProfileHeroSection } from "./_components/profile-hero-section"
import { ProfilePositionsSection } from "./_components/profile-positions-section"

export function Profile({
  address,
  readOnly = false,
}: {
  address: string
  readOnly?: boolean
}) {
  const currentAccount = useCurrentAccount()

  useEffect(() => {
    track("ProfileView", {
      address,
      isOwnProfile: currentAccount?.address === address,
    })
  }, [address, currentAccount?.address])

  const staking = useStaking()
  const stakedWalWithStatus = useStakedWalWithStatus({ address })
  const validators = useFullOperators()
  const validatorMap = useMemo(() => keyBy(validators, "id"), [validators])

  const { walBalance } = useBalances({ address })
  const totalStakedBalance = useMemo(
    () => sumBy(stakedWalWithStatus, "amount"),
    [stakedWalWithStatus]
  )

  const estimatedReward = useEstimatedReward({
    address,
    stakedWals: stakedWalWithStatus,
  })

  const { tier, stakingPeriod } = useMemo(() => {
    if (!staking || !stakedWalWithStatus) {
      return {
        tier: last(tiers)!,
        stakingPeriod: null as number | null,
      }
    }
    const userEpoch =
      minBy(stakedWalWithStatus, "activationEpoch")?.activationEpoch ||
      staking.epoch + 1
    const stakingPeriodMs =
      stakedWalWithStatus.length > 0
        ? staking.epochDurationMs * 1000 * (staking.epoch - (userEpoch - 1))
        : null
    const percentile = ((staking.epoch - (userEpoch - 1)) / staking.epoch) * 100
    return {
      tier: tiers.find((t) => percentile >= t.percentile)!,
      stakingPeriod: stakingPeriodMs ? stakingPeriodMs / 1000 : null,
    }
  }, [stakedWalWithStatus, staking])

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-foreground text-2xl font-bold tracking-[-0.01em]">
        Profile
      </h1>

      <ProfileHeroSection
        address={address}
        readOnly={readOnly}
        walBalance={walBalance}
        walBalanceLoading={walBalance === null}
        totalStakedBalance={totalStakedBalance}
        stakedLoading={stakedWalWithStatus === null}
        totalPositions={stakedWalWithStatus?.length ?? 0}
        estimatedRewardTotal={estimatedReward?.total ?? 0}
        estimatedRewardLoading={!estimatedReward}
        tier={tier}
        stakingPeriod={stakingPeriod}
      />

      <ProfilePositionsSection
        readOnly={readOnly}
        stakedWalWithStatus={stakedWalWithStatus}
        validatorMap={validatorMap}
        estimatedRewards={estimatedReward?.rewards}
      />
    </div>
  )
}
