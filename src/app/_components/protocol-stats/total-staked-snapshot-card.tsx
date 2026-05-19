"use client"

import { useMemo } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { usePrices } from "@/hooks/use-prices"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { HistoricalData } from "@/types"

import { GlassCard } from "@/components/ui/glass-card"
import { useHomeMetrics } from "./use-home-metrics"

function pctDelta(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value == null || !Number.isFinite(value)) return null
  const isUp = value >= 0
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 text-sm font-medium",
        isUp ? "text-success-foreground" : "text-error-foreground"
      )}
    >
      {isUp ? (
        <TrendingUp className="size-4" />
      ) : (
        <TrendingDown className="size-4" />
      )}
      {formatter.percentage(Math.abs(value), { mantissa: 1, percent: false })}%
    </span>
  )
}

export function TotalStakedSnapshotCard({
  historicalData,
}: {
  historicalData: HistoricalData[]
}) {
  const { totalStakedWAL } = useHomeMetrics()
  const prices = usePrices()

  const latest = historicalData[historicalData.length - 1]
  const prev = historicalData[historicalData.length - 2]

  const delta = useMemo(
    () =>
      pctDelta(latest?.totalStakedWAL ?? null, prev?.totalStakedWAL ?? null),
    [latest?.totalStakedWAL, prev?.totalStakedWAL]
  )

  const totalStakedUsd = useMemo(() => {
    if (totalStakedWAL == null || !prices.data) return null
    return totalStakedWAL * prices.data.wal.price
  }, [totalStakedWAL, prices.data])

  return (
    <GlassCard
      tone="chart"
      className={cn(
        "h-[197px] w-full shrink-0",
        "md:w-[280px] md:max-w-[280px] md:min-w-[280px]"
      )}
      contentClassName="h-full"
      innerClassName="h-full justify-between"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="text-brand-300 min-w-0 truncate text-sm font-semibold">
          Total Staked ($WAL)
        </p>
        <DeltaBadge value={delta} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
        {totalStakedWAL != null ? (
          <p className="font-heading text-foreground truncate text-[28px] leading-none font-bold tracking-[-0.01em]">
            {formatter.numberReadable(totalStakedWAL)}
          </p>
        ) : (
          <Skeleton className="h-7 w-32" />
        )}
        {totalStakedUsd != null ? (
          <p className="text-tertiary mt-1 truncate text-sm leading-5 font-normal">
            ${formatter.numberReadable(totalStakedUsd)}
          </p>
        ) : (
          <Skeleton className="mt-1 h-4 w-20" />
        )}
      </div>

      <Separator className="mx-auto my-2" />

      <div className="text-tertiary grid min-w-0 grid-cols-2 gap-2 text-sm font-bold">
        <span className="truncate">Yesterday</span>
        <span className="truncate text-right">
          {prev?.totalStakedWAL != null
            ? `${formatter.numberReadable(prev.totalStakedWAL, 2)} WAL`
            : "—"}
        </span>
      </div>
    </GlassCard>
  )
}
