"use client"

import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
import { filterByRange, type Timerange } from "./timerange-picker"
import type { ProtocolHealthDecentralization } from "@/hooks/use-protocol-health"

const COLOR = "var(--color-brand-400)"

const qualitative = (n: number) =>
  n <= 3
    ? { label: "high risk", interp: "Stake is concentrated — small operator coalitions could overwhelm consensus." }
    : n <= 6
      ? { label: "moderate", interp: "Stake is moderately concentrated — watch for trend." }
      : { label: "well distributed", interp: "Stake is broadly distributed across the active set." }

export function CentralizationRiskCard({
  decentralization,
  range,
  loading,
}: {
  decentralization: ProtocolHealthDecentralization[]
  range: Timerange
  loading?: boolean
}) {
  const { rows, latest } = useMemo(() => {
    const rows = filterByRange(decentralization, range)
    return { rows, latest: rows[rows.length - 1] }
  }, [decentralization, range])

  const q = latest ? qualitative(latest.nakamoto33) : null

  return (
    <MetricCard
      className="h-full"
      title="Centralization Risk"
      description="Nakamoto Coefficient: smallest number of operators that together control ≥33% of stake weight. Higher = more decentralized."
      legend={[{ label: "Nakamoto-33", color: COLOR }]}
      value={latest ? `N = ${formatter.number(latest.nakamoto33, 0)}` : null}
      context={q?.label}
      interpretation={q?.interp}
      loading={loading}
    >
      <ChartContainer
        watermark={false}
        className={METRIC_CHART_CLASS}
        config={{ nakamoto33: { color: COLOR, label: "Nakamoto-33" } }}
      >
        <LineChart data={rows} margin={METRIC_CHART_MARGIN}>
          <CartesianGrid {...METRIC_GRID_PROPS} />
          <YAxis hide domain={[0, "dataMax + 1"]} />
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
              />
            }
          />
          <Line
            type="monotone"
            dataKey="nakamoto33"
            stroke={COLOR}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </MetricCard>
  )
}
