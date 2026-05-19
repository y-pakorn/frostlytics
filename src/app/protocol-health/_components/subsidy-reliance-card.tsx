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
import type { ProtocolHealthRevenue } from "@/hooks/use-protocol-health"

const USER_COLOR = "var(--color-accent-blue)"
const SUBSIDY_COLOR = "var(--color-brand-400)"

export function SubsidyRelianceCard({
  revenue,
  loading,
}: {
  revenue: ProtocolHealthRevenue[]
  range: Timerange
  loading?: boolean
}) {
  const { series, latest } = useMemo(() => {
    // Aggregate per epoch — revenue rows may be per-checkpoint.
    const userByEpoch = new Map<number, number>()
    const subByEpoch = new Map<number, number>()
    for (const r of revenue) {
      userByEpoch.set(
        r.toEpoch,
        (userByEpoch.get(r.toEpoch) ?? 0) + (r.userFeeWAL ?? 0)
      )
      subByEpoch.set(
        r.toEpoch,
        (subByEpoch.get(r.toEpoch) ?? 0) +
          (r.fixedRateSubsidyWAL ?? 0) +
          (r.usageSubsidyWAL ?? 0)
      )
    }
    const keys = new Set<number>()
    userByEpoch.forEach((_v, k) => keys.add(k))
    subByEpoch.forEach((_v, k) => keys.add(k))
    const epochs = Array.from(keys).sort((a, b) => a - b)
    const series = epochs
      .map((epoch) => {
        const user = userByEpoch.get(epoch) ?? 0
        const subsidy = subByEpoch.get(epoch) ?? 0
        const total = user + subsidy
        return {
          epoch,
          userShare: total > 0 ? user / total : 0,
          subsidyShare: total > 0 ? subsidy / total : 0,
          total,
        }
      })
      .filter((r) => r.total > 0)
      .slice(-20)
    const latest = series[series.length - 1]
    return { series, latest }
  }, [revenue])

  return (
    <MetricCard
      className="h-full"
      title="Subsidy Reliance"
      description="Share of protocol revenue from real user fees vs protocol-paid subsidies. A healthy network earns more than it subsidizes."
      legend={[
        { label: "User fees", color: USER_COLOR },
        { label: "Subsidies", color: SUBSIDY_COLOR },
      ]}
      value={
        latest
          ? formatter.percentage(latest.userShare, { mantissa: 0 })
          : null
      }
      valueSuffix="user-driven"
      context={
        latest
          ? `${formatter.percentage(latest.subsidyShare, { mantissa: 0 })} subsidized`
          : null
      }
      interpretation={
        latest
          ? latest.userShare > 0.7
            ? "Protocol revenue is mostly user-driven — strong demand."
            : latest.userShare > 0.3
              ? "Protocol revenue is a mix of user fees and subsidies."
              : "Protocol revenue is mostly subsidized — limited organic demand."
          : undefined
      }
      loading={loading}
    >
      {series.length === 0 ? (
        <EmptyChartState message="No revenue data yet" />
      ) : (
        <ChartContainer
          className={METRIC_CHART_CLASS}
          config={{
            userShare: { color: USER_COLOR, label: "User fees" },
            subsidyShare: { color: SUBSIDY_COLOR, label: "Subsidies" },
          }}
        >
          <BarChart
            data={series}
            margin={METRIC_CHART_MARGIN}
          >
            <CartesianGrid {...METRIC_GRID_PROPS} />
            <YAxis hide domain={[0, 1]} />
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
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  valueFormatter={(v) =>
                    formatter.percentage(Number(v), { mantissa: 1 })
                  }
                />
              }
            />
            <Bar
              dataKey="userShare"
              stackId="1"
              fill={USER_COLOR}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="subsidyShare"
              stackId="1"
              fill={SUBSIDY_COLOR}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </MetricCard>
  )
}
