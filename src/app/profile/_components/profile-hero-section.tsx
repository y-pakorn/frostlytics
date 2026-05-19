"use client"

import Link from "next/link"
import { useResolveSuiNSName } from "@mysten/dapp-kit"
import { blo } from "blo"
import BigNumber from "bignumber.js"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { tiers } from "@/config/tier"
import { track } from "@/lib/analytic"
import { STAKE_CTA_CLASS } from "@/lib/dialog-styles"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"

type TierInfo = (typeof tiers)[number]

function MetricRow({
  label,
  value,
  loading,
}: {
  label: string
  value: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className="text-tertiary shrink-0 text-sm leading-5 whitespace-nowrap">
        {label}
      </span>
      <div className="min-w-0 text-right">
        {loading ? (
          <Skeleton className="ml-auto h-5 w-20" />
        ) : (
          <span className="font-heading text-secondary-foreground text-sm font-bold">
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

function TierColumn({
  tier,
  stakingPeriod,
}: {
  tier: TierInfo
  stakingPeriod: number | null
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <img
        src={tier.imageUrl}
        alt={tier.label}
        className="aspect-auto w-11 shrink-0"
      />
      {stakingPeriod != null ? (
        <div className="flex flex-col items-center gap-0.5">
          <p className="font-heading text-foreground text-xl leading-[30px] font-bold">
            {formatter.duration(stakingPeriod)}
          </p>
          <p className="text-tertiary text-base leading-6 font-semibold">
            Staking Period
          </p>
        </div>
      ) : (
        <p className="text-tertiary text-base font-semibold">
          No staking history
        </p>
      )}
    </div>
  )
}

export function ProfileHeroSection({
  address,
  readOnly,
  walBalance,
  walBalanceLoading,
  totalStakedBalance,
  stakedLoading,
  totalPositions,
  estimatedRewardTotal,
  estimatedRewardLoading,
  tier,
  stakingPeriod,
}: {
  address: string
  readOnly?: boolean
  walBalance: BigNumber | null
  walBalanceLoading?: boolean
  totalStakedBalance: number
  stakedLoading?: boolean
  totalPositions: number
  estimatedRewardTotal: number
  estimatedRewardLoading?: boolean
  tier: TierInfo
  stakingPeriod: number | null
}) {
  const { data: name } = useResolveSuiNSName(address)
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
      <GlassCard
        tone="chart"
        className="h-full rounded-[48px]"
        contentClassName="flex h-full flex-col p-0"
        innerClassName="h-full"
      >
        <div className="flex h-full items-center gap-1.5 px-6 py-6">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <img
              src={blo(address as `0x${string}`)}
              alt=""
              className="size-12 shrink-0 rounded-full border border-black/[0.08]"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="font-heading text-foreground truncate text-lg leading-7 font-semibold">
                {name || truncatedAddress}
              </h2>
              <div className="flex min-w-0 items-center gap-1">
                <p className="text-tertiary truncate font-mono text-sm leading-5 font-medium">
                  {truncatedAddress}
                </p>
                <Button
                  variant="ghost"
                  size="iconXs"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(address)
                    toast.success("Address copied to clipboard")
                    track("CopyToClipboard", { contentType: "walletAddress" })
                  }}
                >
                  <Copy />
                </Button>
                <Link
                  href={links.account(address)}
                  target="_blank"
                  className="shrink-0"
                  onClick={() =>
                    track("ExternalLinkClick", {
                      url: links.account(address),
                      label: "SuiScan Profile",
                    })
                  }
                >
                  <Button variant="ghost" size="iconXs">
                    <ExternalLink />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <p className="text-secondary-foreground text-sm leading-5 font-bold">
              Balance
            </p>
            {walBalanceLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="font-heading text-foreground text-2xl font-bold">
                {formatter.numberReadable(walBalance?.toNumber() ?? 0, 2)} WAL
              </p>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard
        tone="chart"
        className="h-full rounded-[48px]"
        contentClassName="h-full p-0"
        innerClassName="h-full"
      >
        <div className="flex h-full flex-col lg:flex-row">
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col px-6 py-6",
              !readOnly ? "justify-between gap-[15px]" : "justify-center gap-[15px]"
            )}
          >
            <div className="flex w-full items-baseline justify-between gap-3">
              <span className="text-brand-400 shrink-0 text-sm leading-5 font-bold whitespace-nowrap">
                Estimated Reward
              </span>
              {estimatedRewardLoading ? (
                <Skeleton className="h-7 w-24 shrink-0" />
              ) : (
                <span
                  className="font-heading text-foreground shrink-0 text-right text-lg leading-normal font-bold lg:text-xl"
                  title={`${formatter.number(estimatedRewardTotal, 4)} WAL`}
                >
                  {formatter.numberReadable(estimatedRewardTotal, 2)} WAL
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <MetricRow
                label="Staked"
                loading={stakedLoading}
                value={`${formatter.numberReadable(totalStakedBalance, 2)} WAL`}
              />
              <MetricRow
                label="Total Position"
                loading={stakedLoading}
                value={totalPositions}
              />
            </div>

            {!readOnly ? (
              <Button variant="purple" className={cn(STAKE_CTA_CLASS, "w-full")} asChild>
                <Link href="/operator">Stake</Link>
              </Button>
            ) : null}
          </div>

          <div className="hidden w-px shrink-0 self-stretch bg-white/5 lg:block" />
          <div className="border-t border-white/5 lg:hidden" />

          <div className="flex items-center justify-center px-3 py-6 lg:w-[147px] lg:shrink-0">
            <TierColumn tier={tier} stakingPeriod={stakingPeriod} />
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
