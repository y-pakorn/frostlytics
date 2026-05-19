"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import {
  METRIC_AXIS_TICK,
  METRIC_CHART_CLASS,
  METRIC_CHART_MARGIN,
  METRIC_GRID_PROPS,
} from "./chart-styles"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"

import { MetricCard } from "@/components/ui/metric-card"
import { deltaOver } from "./stats"
import { filterByRange, type Timerange } from "./timerange-picker"
import type { ProtocolHealthDaily } from "@/hooks/use-protocol-health"

const COLOR = "var(--color-accent-blue)"

export function TVLCard({
  daily,
  range,
  loading,
}: {
  daily: ProtocolHealthDaily[]
  range: Timerange
  loading?: boolean
}) {
  const { rows, latest, delta30 } = useMemo(() => {
    const rows = filterByRange(daily, range)
    const latest = rows[rows.length - 1]
    const delta30 = deltaOver(
      daily.map((d) => d.totalStakedWAL),
      30
    )
    return { rows, latest, delta30 }
  }, [daily, range])

  return (
    <MetricCard
      className="h-full"
      title="Total Value Locked"
      description="Aggregate WAL staked across the network. The headline security and confidence number."
      legend={[{ label: "Staked WAL", color: COLOR }]}
      value={latest ? formatter.numberReadable(latest.totalStakedWAL ?? 0, 2) : null}
      valueSuffix="WAL staked"
      delta={delta30 != null ? { value: delta30, label: "vs 30d ago" } : null}
      interpretation={
        delta30 != null
          ? delta30 > 0.02
            ? "TVL is growing — net inflows over the last 30 days."
            : delta30 < -0.02
              ? "TVL is contracting — net outflows over the last 30 days."
              : "TVL is steady — flat trajectory over the last 30 days."
          : undefined
      }
      loading={loading}
    >
      <ChartContainer
        watermark={false}
        className={METRIC_CHART_CLASS}
        config={{ totalStakedWAL: { color: COLOR, label: "Staked WAL" } }}
      >
        <AreaChart data={rows} margin={METRIC_CHART_MARGIN}>
          <defs>
            <linearGradient id="tvl-stake" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.45} />
              <stop offset="100%" stopColor={COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...METRIC_GRID_PROPS} />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <XAxis
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(v) => dayjs(v).format("MMM D")}
            tick={METRIC_AXIS_TICK}
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
                  `${formatter.numberReadable(v, 2)} WAL`
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="totalStakedWAL"
            stroke={COLOR}
            fill="url(#tvl-stake)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ChartContainer>
    </MetricCard>
  )
}
