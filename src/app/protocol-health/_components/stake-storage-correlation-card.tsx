"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
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
import { usePoolOperators } from "@/hooks"
import { formatter } from "@/lib/formatter"

import { EmptyChartState } from "@/components/ui/empty-chart-state"
import { MetricCard } from "@/components/ui/metric-card"
import { pearson } from "./stats"

const COLOR = "var(--color-accent-blue)"

export function StakeStorageCorrelationCard() {
  const { data: operators, isLoading } = usePoolOperators()

  const { points, r } = useMemo(() => {
    const list = (operators ?? []).filter(
      (o) =>
        (o.state === "Active" || o.state === "PreActive") &&
        o.staked > 0 &&
        o.capacityTB > 0
    )
    const points = list.map((o) => ({
      x: o.staked,
      y: o.capacityTB,
      name: o.name,
    }))
    const r = pearson(
      points.map((p) => p.x),
      points.map((p) => p.y)
    )
    return { points, r }
  }, [operators])

  return (
    <MetricCard
      className="h-full"
      title="Stake vs Storage"
      description="One dot per active operator: staked WAL (x) vs storage capacity (y). Positive r means higher security correlates with higher utility. Log scale on both axes."
      legend={[{ label: "Operator", color: COLOR }]}
      value={points.length ? formatter.number(r, 2) : null}
      valueSuffix="Pearson r"
      context={points.length ? `${points.length} operators` : null}
      interpretation={
        points.length
          ? Math.abs(r) < 0.3
            ? "Stake and storage are weakly correlated — capacity is allocated independently of stake."
            : r > 0.3
              ? "Larger stakers tend to provide larger storage — alignment between security and utility."
              : "Larger stakers tend to provide less storage — possible decoupling worth investigating."
          : undefined
      }
      loading={isLoading}
    >
      {points.length === 0 ? (
        <EmptyChartState message="No active operators with capacity" />
      ) : (
        <ChartContainer
          className={METRIC_CHART_CLASS}
          config={{ y: { color: COLOR, label: "Capacity (TB)" } }}
        >
          <ScatterChart margin={METRIC_CHART_MARGIN}>
            <CartesianGrid strokeOpacity={0.1} />
            <XAxis
              type="number"
              dataKey="x"
              scale="log"
              domain={["auto", "auto"]}
              ticks={[1_000, 10_000, 100_000, 1_000_000, 10_000_000]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${formatter.numberReadable(v, 0)}`}
              tick={METRIC_AXIS_TICK}
            />
            <YAxis
              type="number"
              dataKey="y"
              scale="log"
              domain={["auto", "auto"]}
              ticks={[1, 10, 100, 1_000]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${formatter.numberReadable(v, 0)}TB`}
              tick={METRIC_AXIS_TICK}
              width={48}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  hideLabel
                  valueFormatter={(v) =>
                    formatter.numberReadable(Number(v), 2)
                  }
                />
              }
            />
            <Scatter data={points} fill={COLOR} />
          </ScatterChart>
        </ChartContainer>
      )}
    </MetricCard>
  )
}
