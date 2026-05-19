"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import type {
  ProtocolHealthDaily,
  ProtocolHealthRevenue,
} from "@/hooks/use-protocol-health"

const COLOR = "var(--color-brand-400)"

export function OperatorProfitabilityCard({
  daily,
  revenue,
  loading,
}: {
  daily: ProtocolHealthDaily[]
  revenue: ProtocolHealthRevenue[]
  range: Timerange
  loading?: boolean
}) {
  const { series, latest } = useMemo(() => {
    const opByEpoch = new Map<number, number>()
    for (const d of daily) {
      if (d.epoch != null && d.operatorCount != null) {
        opByEpoch.set(d.epoch, d.operatorCount)
      }
    }
    // Aggregate revenue per epoch (revenue rows can be per-checkpoint, so
    // multiple rows may share the same toEpoch — without aggregation we get
    // duplicate X-axis labels).
    const feesByEpoch = new Map<number, number>()
    for (const r of revenue) {
      feesByEpoch.set(
        r.toEpoch,
        (feesByEpoch.get(r.toEpoch) ?? 0) + (r.userFeeWAL ?? 0)
      )
    }
    const series = Array.from(feesByEpoch.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([epoch, fees]) => {
        const count = opByEpoch.get(epoch)
        return {
          epoch,
          avgWALPerNode: count && count > 0 ? fees / count : 0,
        }
      })
      .filter((p) => p.avgWALPerNode > 0)
      // Last 20 epochs keeps bars readable at card size.
      .slice(-20)
    const latest = series[series.length - 1]
    return { series, latest }
  }, [daily, revenue])

  return (
    <MetricCard
      className="h-full"
      title="Operator Profitability"
      description="Average user-fee revenue per active node, per epoch. Indicator of the economic incentive to stay online."
      legend={[{ label: "WAL / node", color: COLOR }]}
      value={latest ? formatter.number(latest.avgWALPerNode, 2) : null}
      valueSuffix="WAL / node / epoch"
      context={series.length ? `last ${series.length} epochs shown` : null}
      interpretation={
        latest
          ? latest.avgWALPerNode < 1
            ? "Per-node revenue is thin — operators may rely on subsidies."
            : "Per-node revenue is meaningful — operators have skin in the game."
          : undefined
      }
      loading={loading}
    >
      {series.length === 0 ? (
        <EmptyChartState message="No revenue data yet" />
      ) : (
        <ChartContainer
          className={METRIC_CHART_CLASS}
          config={{ avgWALPerNode: { color: COLOR, label: "WAL / node" } }}
        >
          <BarChart
            data={series}
            margin={METRIC_CHART_MARGIN}
          >
            <CartesianGrid {...METRIC_GRID_PROPS} />
            <YAxis hide domain={[0, "dataMax"]} />
            <XAxis
              dataKey="epoch"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tickFormatter={(v) => `Ep ${v}`}
              tick={METRIC_AXIS_TICK}
              type="category"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  valueFormatter={(v) => `${formatter.number(v, 2)} WAL`}
                />
              }
            />
            <Bar dataKey="avgWALPerNode" fill={COLOR} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </MetricCard>
  )
}
