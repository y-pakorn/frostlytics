"use client"

import { TrendingDown, TrendingUp } from "lucide-react"

import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { HistoricalData } from "@/types"

import { HomeCardTone, HomeGlassCard } from "./home-glass-card"

function DeltaBadge({ value }: { value: number | null }) {
  if (value == null || !Number.isFinite(value)) return null
  const isUp = value >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isUp ? "text-success-foreground" : "text-error-foreground"
      )}
    >
      {isUp ? (
        <TrendingUp className="size-4" />
      ) : (
        <TrendingDown className="size-4" />
      )}
      {formatter.percentage(Math.abs(value), { mantissa: 0, percent: false })}%
    </span>
  )
}

function SummaryCard({
  title,
  dayLabel,
  value,
  delta,
  prevValue,
  tone,
}: {
  title: string
  dayLabel: string
  value: string
  delta: number | null
  prevValue: string
  tone: HomeCardTone
}) {
  return (
    <HomeGlassCard
      tone={tone}
      className="h-full min-w-0 flex-1"
      innerClassName="h-full justify-between"
      contentClassName="px-4 py-3"
    >
      <p className="font-heading text-sm font-bold text-white">{title}</p>
      <div className="space-y-0.5">
        <p className="text-secondary-foreground text-sm font-bold">{dayLabel}</p>
        <div className="flex items-end gap-1">
          <p className="text-foreground text-xl leading-[30px] font-semibold">
            {value}
          </p>
          <DeltaBadge value={delta} />
        </div>
      </div>
      <div className="text-tertiary flex items-center justify-between text-sm font-bold">
        <span>Yesterday</span>
        <span>{prevValue}</span>
      </div>
    </HomeGlassCard>
  )
}

function pctDelta(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function formatDayLabel(timestamp?: string) {
  return timestamp ? dayjs(timestamp).format("MMM D, YYYY") : "—"
}

export function DailySummarySection({
  historicalData,
}: {
  historicalData: HistoricalData[]
}) {
  const latest = historicalData[historicalData.length - 1]
  const prev = historicalData[historicalData.length - 2]

  const dayLabel = formatDayLabel(latest?.timestamp)

  const feesDelta = pctDelta(
    latest?.paidFeesUSD ?? null,
    prev?.paidFeesUSD ?? null
  )
  const storageDelta = pctDelta(
    latest?.storageUsedTB ?? null,
    prev?.storageUsedTB ?? null
  )
  const stakingDelta = pctDelta(
    latest?.totalStakedWAL ?? null,
    prev?.totalStakedWAL ?? null
  )

  const stakingChangeWal =
    latest?.totalStakedWAL != null && prev?.totalStakedWAL != null
      ? latest.totalStakedWAL - prev.totalStakedWAL
      : null

  return (
    <div className="flex h-full min-w-0 flex-col gap-3">
      <h2 className="font-heading text-foreground text-2xl font-bold">
        Daily Summary
      </h2>
      <div className="flex min-h-[140px] flex-1 flex-col gap-2.5 sm:flex-row sm:items-stretch lg:min-h-0 lg:gap-2.5">
        <SummaryCard
          title="Fees"
          dayLabel={dayLabel}
          value={`$${formatter.number(latest?.paidFeesUSD ?? 0)}`}
          delta={feesDelta}
          prevValue={`$${formatter.number(prev?.paidFeesUSD ?? 0)}`}
          tone={
            feesDelta != null && feesDelta >= 0
              ? "epoch-success"
              : "epoch-error"
          }
        />
        <SummaryCard
          title="Storage"
          dayLabel={dayLabel}
          value={`${formatter.number(latest?.storageUsedTB ?? 0)} TB`}
          delta={storageDelta}
          prevValue={`${formatter.number(prev?.storageUsedTB ?? 0)} TB`}
          tone={
            storageDelta != null && storageDelta < 0
              ? "epoch-error"
              : "epoch-success"
          }
        />
        <SummaryCard
          title="Staking Changes"
          dayLabel={dayLabel}
          value={
            stakingChangeWal != null
              ? `${formatter.numberReadable(stakingChangeWal, 0)} WAL`
              : "—"
          }
          delta={stakingDelta}
          prevValue={`${formatter.numberReadable(prev?.totalStakedWAL ?? 0, 0)} WAL`}
          tone={
            stakingDelta != null && stakingDelta >= 0
              ? "epoch-success"
              : "epoch-error"
          }
        />
      </div>
    </div>
  )
}
