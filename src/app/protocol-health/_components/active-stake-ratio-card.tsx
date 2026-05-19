"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"

import { EmptyChartState } from "@/components/ui/empty-chart-state"
import { MetricCard } from "@/components/ui/metric-card"
import { filterByRange, type Timerange } from "./timerange-picker"
import type {
  ProtocolHealthDaily,
  ProtocolHealthDecentralization,
} from "@/hooks/use-protocol-health"

const COLOR = "var(--color-accent-blue)"

const dayKey = (s: string) => s.slice(0, 10)

export function ActiveStakeRatioCard({
  daily,
  decentralization,
  range,
  loading,
}: {
  daily: ProtocolHealthDaily[]
  decentralization: ProtocolHealthDecentralization[]
  range: Timerange
  loading?: boolean
}) {
  const { rows, latest } = useMemo(() => {
    // Join by day. aggregated_daily.totalStakedWAL is the network-wide total;
    // decentralization.activeStakedWAL is the sum across the active set.
    const totalByDay = new Map<string, number | null>()
    for (const d of daily) totalByDay.set(dayKey(d.timestamp), d.totalStakedWAL)
    const joined = decentralization.map((d) => {
      const total = totalByDay.get(dayKey(d.timestamp)) ?? null
      const ratio =
        total != null && total > 0 ? d.activeStakedWAL / total : null
      return { timestamp: d.timestamp, ratio }
    })
    const rows = filterByRange(
      joined.filter((r) => r.ratio != null),
      range
    )
    return { rows, latest: rows[rows.length - 1] }
  }, [daily, decentralization, range])

  return (
    <MetricCard
      title="Active Stake Ratio"
      description="Share of total staked WAL that is in the active operator set (vs pending or inactive pools)."
      legend={[{ label: "Active share", color: COLOR }]}
      value={
        latest?.ratio != null
          ? formatter.percentage(latest.ratio, { mantissa: 0 })
          : null
      }
      valueSuffix="active"
      context="of total staked WAL"
      interpretation={
        latest?.ratio != null
          ? latest.ratio > 0.95
            ? "Nearly all staked WAL is securing the network — minimal idle stake."
            : latest.ratio > 0.85
              ? "Most staked WAL is in the active set; some pending capital is idle."
              : "A meaningful share of stake is outside the active set — security may be lower than TVL suggests."
          : undefined
      }
      loading={loading}
    >
      {rows.length === 0 ? (
        <EmptyChartState message="No active-stake data yet" />
      ) : (
        <ChartContainer
          watermark={false}
          className="h-full w-full"
          config={{ ratio: { color: COLOR, label: "Active share" } }}
        >
          <AreaChart
            data={rows}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="active-ratio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR} stopOpacity={0.7} />
                <stop offset="95%" stopColor={COLOR} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.1} />
            <YAxis hide domain={["dataMin - 0.02", 1]} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v) => dayjs(v).format("MMM D")}
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  includeDate={{
                    key: "timestamp",
                    formatter: (v) => dayjs(v).format("MMM D, YYYY"),
                  }}
                  valueFormatter={(v) =>
                    formatter.percentage(Number(v), { mantissa: 1 })
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="ratio"
              stroke={COLOR}
              fill="url(#active-ratio)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </MetricCard>
  )
}
