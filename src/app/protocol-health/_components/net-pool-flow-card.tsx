"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

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
import { formatter } from "@/lib/formatter"

import { EmptyChartState } from "@/components/ui/empty-chart-state"
import { MetricCard } from "@/components/ui/metric-card"
import type { Timerange } from "./timerange-picker"
import type { ProtocolHealthRevenue } from "@/hooks/use-protocol-health"

const POS_COLOR = "var(--color-success-foreground)"
const NEG_COLOR = "var(--color-error-foreground)"

export function NetPoolFlowCard({
  revenue,
  loading,
}: {
  revenue: ProtocolHealthRevenue[]
  range: Timerange
  loading?: boolean
}) {
  const { series, net30 } = useMemo(() => {
    const byEpoch = new Map<number, { funding: number; drain: number }>()
    for (const r of revenue) {
      const b = byEpoch.get(r.toEpoch) ?? { funding: 0, drain: 0 }
      b.funding += r.poolFundingWAL ?? 0
      b.drain += r.poolDrainWAL ?? 0
      byEpoch.set(r.toEpoch, b)
    }
    const series = Array.from(byEpoch.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([epoch, v]) => ({
        epoch,
        net: v.funding - v.drain,
      }))
      .filter((p) => p.net !== 0)
      .slice(-30)
    const net30 = series.reduce((a, p) => a + p.net, 0)
    return { series, net30 }
  }, [revenue])

  return (
    <MetricCard
      className="h-full"
      title="Reward Pool Flow"
      description="Net change in the rewards pool per epoch: total funding (user fees + subsidies) minus payouts to stakers. Tracks whether the pool is accumulating reserves or paying them out."
      legend={[
        { label: "Pool growing", color: POS_COLOR },
        { label: "Pool draining", color: NEG_COLOR },
      ]}
      value={
        series.length ? (
          <span
            className={
              net30 >= 0
                ? "text-success-foreground"
                : "text-error-foreground"
            }
          >
            {net30 >= 0 ? "+" : ""}
            {formatter.numberReadable(net30, 2)}
          </span>
        ) : null
      }
      valueSuffix="WAL · last 30 ep"
      interpretation={
        series.length
          ? net30 > 0
            ? "Rewards pool is accumulating — funding exceeds payouts."
            : net30 < 0
              ? "Rewards pool is draining — payouts exceed funding."
              : "Pool is in equilibrium — funding equals payouts."
          : undefined
      }
      loading={loading}
    >
      {series.length === 0 ? (
        <EmptyChartState message="No pool-flow data yet" />
      ) : (
        <ChartContainer
          className={METRIC_CHART_CLASS}
          config={{ net: { color: POS_COLOR, label: "Net WAL" } }}
        >
          <BarChart
            data={series}
            margin={METRIC_CHART_MARGIN}
          >
            <CartesianGrid {...METRIC_GRID_PROPS} />
            <YAxis hide domain={["auto", "auto"]} />
            <XAxis
              dataKey="epoch"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tickFormatter={(v) => `Ep ${v}`}
              tick={METRIC_AXIS_TICK}
            />
            <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.3} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  valueFormatter={(v) =>
                    `${formatter.numberReadable(Number(v), 2)} WAL`
                  }
                />
              }
            />
            <Bar dataKey="net" radius={[2, 2, 2, 2]}>
              {series.map((p) => (
                <Cell
                  key={p.epoch}
                  fill={p.net >= 0 ? POS_COLOR : NEG_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </MetricCard>
  )
}
