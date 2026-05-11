"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatter } from "@/lib/formatter"

import { EmptyChartState } from "./empty-chart-state"
import { MetricCard } from "./metric-card"
import type { Timerange } from "./timerange-picker"
import type { ProtocolHealthRevenue } from "@/hooks/use-protocol-health"

const USER_COLOR = "var(--color-accent-blue)"
const FIXED_COLOR = "var(--color-accent-purple-light)"
const USAGE_COLOR = "var(--color-accent-purple)"

export function RevenueCompositionCard({
  revenue,
  loading,
}: {
  revenue: ProtocolHealthRevenue[]
  range: Timerange
  loading?: boolean
}) {
  const { series, latest } = useMemo(() => {
    const byEpoch = new Map<
      number,
      { user: number; fixed: number; usage: number }
    >()
    for (const r of revenue) {
      const b = byEpoch.get(r.toEpoch) ?? { user: 0, fixed: 0, usage: 0 }
      b.user += r.userFeeWAL ?? 0
      b.fixed += r.fixedRateSubsidyWAL ?? 0
      b.usage += r.usageSubsidyWAL ?? 0
      byEpoch.set(r.toEpoch, b)
    }
    const series = Array.from(byEpoch.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([epoch, v]) => ({
        epoch,
        user: v.user,
        fixed: v.fixed,
        usage: v.usage,
        total: v.user + v.fixed + v.usage,
      }))
      .filter((p) => p.total > 0)
      .slice(-20)
    const latest = series[series.length - 1]
    return { series, latest }
  }, [revenue])

  return (
    <MetricCard
      title="Revenue Composition"
      description="Absolute WAL by source per epoch: user fees, fixed-rate subsidy, usage subsidy. Shows scale, not ratios."
      legend={[
        { label: "User fees", color: USER_COLOR },
        { label: "Fixed subsidy", color: FIXED_COLOR },
        { label: "Usage subsidy", color: USAGE_COLOR },
      ]}
      value={latest ? formatter.numberReadable(latest.total, 2) : null}
      valueSuffix="WAL · latest epoch"
      context={
        latest && latest.total > 0
          ? `${formatter.percentage(latest.user / latest.total, { mantissa: 0 })} user-driven`
          : null
      }
      loading={loading}
    >
      {series.length === 0 ? (
        <EmptyChartState message="No revenue data yet" />
      ) : (
        <ChartContainer
          watermark={false}
          className="h-full w-full"
          config={{
            user: { color: USER_COLOR, label: "User fees" },
            fixed: { color: FIXED_COLOR, label: "Fixed subsidy" },
            usage: { color: USAGE_COLOR, label: "Usage subsidy" },
          }}
        >
          <BarChart
            data={series}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeOpacity={0.1} />
            <YAxis hide domain={[0, "dataMax"]} />
            <XAxis
              dataKey="epoch"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tickFormatter={(v) => `Ep ${v}`}
              tick={{ fontSize: 10 }}
            />
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
            <Bar dataKey="user" stackId="1" fill={USER_COLOR} />
            <Bar dataKey="fixed" stackId="1" fill={FIXED_COLOR} />
            <Bar
              dataKey="usage"
              stackId="1"
              fill={USAGE_COLOR}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </MetricCard>
  )
}
