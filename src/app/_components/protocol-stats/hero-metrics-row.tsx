"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"

import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useCirculatingSupply } from "@/hooks/use-circulating-supply"
import { usePrices } from "@/hooks/use-prices"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useStaking, useSystem } from "@/hooks"
import { HistoricalData } from "@/types"

import { HomeGlassCard } from "./home-glass-card"
import { TotalStakedSnapshotCard } from "./total-staked-snapshot-card"
import { useHomeMetrics } from "./use-home-metrics"
import { YourPositionCard } from "./your-position-card"

const HERO_ROW_HEIGHT = "h-[197px]"

function CountdownPill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg px-3 py-1",
        "bg-gradient-to-b from-[#363344] to-[#3a3268]",
        "shadow-[0px_4px_8px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.2),inset_0px_1px_2px_0px_rgba(255,255,255,0.3)]",
        className
      )}
    >
      {children}
    </div>
  )
}

function HeroMetric({
  value,
  label,
  loading,
}: {
  value: ReactNode
  label: string
  loading?: boolean
}) {
  return (
    <div className="min-w-0">
      {loading ? (
        <Skeleton className="h-[22px] w-14" />
      ) : (
        <p className="font-heading text-foreground truncate text-lg leading-normal font-bold tracking-[-0.01em]">
          {value}
        </p>
      )}
      <p className="text-tertiary truncate text-sm leading-5 font-normal">
        {label}
      </p>
    </div>
  )
}

export function HeroMetricsRow({
  averageApy,
  historicalData,
}: {
  averageApy: number | null
  historicalData: HistoricalData[]
}) {
  const staking = useStaking()
  const system = useSystem()
  const prices = usePrices()
  const { totalStakedWAL } = useHomeMetrics()
  const circulatingSupply = useCirculatingSupply()
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    if (!staking) return
    const updateRemaining = () => {
      const now = Date.now()
      const end = staking.epochChangeDoneMs + staking.epochDurationMs
      let diff = end - now
      if (diff <= 0) {
        setRemaining({ d: 0, h: 0, m: 0, s: 0 })
        return
      }
      const d = Math.floor(diff / (24 * 60 * 60 * 1000))
      diff -= d * 24 * 60 * 60 * 1000
      const h = Math.floor(diff / (60 * 60 * 1000))
      diff -= h * 60 * 60 * 1000
      const m = Math.floor(diff / (60 * 1000))
      diff -= m * 60 * 1000
      const s = Math.floor(diff / 1000)
      setRemaining({ d, h, m, s })
    }
    updateRemaining()
    const interval = setInterval(updateRemaining, 1000)
    return () => clearInterval(interval)
  }, [staking])

  const estEpochRewardUsd = useMemo(() => {
    if (!totalStakedWAL || !averageApy || !staking || !prices.data) return null
    const yearMs = 365 * 24 * 60 * 60 * 1000
    const epochFraction = staking.epochDurationMs / yearMs
    const walReward = totalStakedWAL * (averageApy / 100) * epochFraction
    return walReward * prices.data.wal.price
  }, [totalStakedWAL, averageApy, staking, prices.data])

  const epochLabel = staking ? `Epoch ${staking.epoch}` : "—"

  return (
    <div
      className={cn(
        "flex shrink-0 items-start gap-3",
        "max-md:h-auto max-md:flex-col",
        HERO_ROW_HEIGHT
      )}
    >
      <HomeGlassCard
        tone="chart"
        className={cn("min-w-0 flex-1", HERO_ROW_HEIGHT)}
        contentClassName="h-full"
        innerClassName="h-full justify-between"
      >
        <div className="flex min-w-0 items-center justify-between gap-3 overflow-hidden">
          <div className="min-w-0 shrink">
            {staking ? (
              <p className="font-heading text-foreground truncate text-base leading-normal font-bold tracking-[-0.01em]">
                {epochLabel}
              </p>
            ) : (
              <Skeleton className="h-4 w-20" />
            )}
            <p className="font-heading text-tertiary text-[10px] leading-normal font-normal tracking-[-0.01em]">
              Remaining time
            </p>
            <div
              className={cn(
                "mt-1",
                remaining.d > 0
                  ? "inline-grid grid-cols-[auto_1fr] grid-rows-1"
                  : "inline-flex"
              )}
            >
              {remaining.d > 0 && (
                <CountdownPill className="col-start-1 rounded-r-none">
                  <span className="font-heading text-foreground text-2xl leading-normal font-semibold tracking-[-0.02em] tabular-nums">
                    {remaining.d}d
                  </span>
                </CountdownPill>
              )}
              <CountdownPill
                className={cn(
                  "flex items-center gap-0 px-3",
                  remaining.d > 0 ? "col-start-2 rounded-l-none" : ""
                )}
              >
                <span className="font-heading text-foreground px-1 text-2xl leading-normal font-semibold tracking-[-0.02em] tabular-nums">
                  {String(remaining.h).padStart(2, "0")}
                </span>
                <span className="text-foreground w-[7px] shrink-0 text-center text-2xl leading-normal font-extralight">
                  :
                </span>
                <span className="font-heading text-foreground px-1 text-2xl leading-normal font-semibold tracking-[-0.02em] tabular-nums">
                  {String(remaining.m).padStart(2, "0")}
                </span>
                <span className="text-foreground w-[7px] shrink-0 text-center text-2xl leading-normal font-extralight">
                  :
                </span>
                <span className="font-heading text-foreground px-1 text-2xl leading-normal font-semibold tracking-[-0.02em] tabular-nums">
                  {String(remaining.s).padStart(2, "0")}
                </span>
              </CountdownPill>
            </div>
          </div>

          <div className="min-w-0 shrink text-right">
            {estEpochRewardUsd != null ? (
              <p className="font-heading text-foreground truncate text-[28px] leading-none font-bold">
                ${formatter.number(estEpochRewardUsd)}
              </p>
            ) : (
              <Skeleton className="ml-auto h-7 w-24" />
            )}
            <p className="text-brand-300 mt-1 truncate text-sm leading-5 font-bold">
              Est. Total Reward ({epochLabel})
            </p>
          </div>
        </div>

        <Separator className="mx-auto" />

        <div className="grid w-full min-w-0 grid-cols-3 gap-3">
          <HeroMetric
            value={
              averageApy != null
                ? formatter.percentage(averageApy, { mantissa: 4 })
                : "—"
            }
            label="Average Staking APY%"
            loading={averageApy == null}
          />
          <HeroMetric
            value={
              circulatingSupply.data
                ? formatter.numberReadable(circulatingSupply.data)
                : "—"
            }
            label="Circulating Supply ($WAL)"
            loading={!circulatingSupply.data}
          />
          <HeroMetric
            value={
              system
                ? `${formatter.numberReadable(system.usedCapacityTB)} TB`
                : "—"
            }
            label="Storage Used"
            loading={!system}
          />
        </div>
      </HomeGlassCard>

      <TotalStakedSnapshotCard historicalData={historicalData} />

      <YourPositionCard />
    </div>
  )
}
