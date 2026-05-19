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

const COLOR = "var(--color-brand-400)"

export function ProtocolRevenueCard({
  daily,
  range,
  loading,
}: {
  daily: ProtocolHealthDaily[]
  range: Timerange
  loading?: boolean
}) {
  const { rows, total30, delta30 } = useMemo(() => {
    const rows = filterByRange(daily, range)
    const last30 = daily.slice(-30)
    const prev30 = daily.slice(-60, -30)
    const total30 = last30.reduce((a, d) => a + (d.paidFeesUSD ?? 0), 0)
    const prevTotal = prev30.reduce((a, d) => a + (d.paidFeesUSD ?? 0), 0)
    const delta30 =
      prevTotal > 0
        ? (total30 - prevTotal) / prevTotal
        : null
    return { rows, total30, delta30 }
  }, [daily, range])

  return (
    <MetricCard
      className="h-full"
      title="Protocol Revenue"
      description="Daily fees paid in USD. Direct signal on usage demand and financial viability."
      legend={[{ label: "Fees (USD)", color: COLOR }]}
      value={`$${formatter.numberReadable(total30, 1)}`}
      valueSuffix="past 30d"
      delta={delta30 != null ? { value: delta30, label: "vs prior 30d" } : null}
      interpretation={
        delta30 != null
          ? delta30 > 0.1
            ? "Demand is accelerating — fees up materially vs prior month."
            : delta30 < -0.1
              ? "Demand softened — fees down materially vs prior month."
              : "Demand is steady — fees within ±10% of prior month."
          : undefined
      }
      loading={loading}
    >
      <ChartContainer
        watermark={false}
        className={METRIC_CHART_CLASS}
        config={{ paidFeesUSD: { color: COLOR, label: "Fees (USD)" } }}
      >
        <AreaChart data={rows} margin={METRIC_CHART_MARGIN}>
          <defs>
            <linearGradient id="revenue-fees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOR} stopOpacity={0.7} />
              <stop offset="95%" stopColor={COLOR} stopOpacity={0.05} />
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
                valueFormatter={(v) => `$${formatter.number(v, 2)}`}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="paidFeesUSD"
            stroke={COLOR}
            fill="url(#revenue-fees)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </MetricCard>
  )
}
