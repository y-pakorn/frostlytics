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

const qualitative = (g: number) =>
  g < 0.3
    ? { label: "highly equal", interp: "Stake (and so rewards) are evenly distributed across operators." }
    : g < 0.5
      ? { label: "moderate inequality", interp: "Stake distribution shows typical inequality for a market-based set." }
      : g < 0.7
        ? { label: "high inequality", interp: "Stake is heavily skewed toward a few large operators." }
        : { label: "extreme inequality", interp: "A few operators dominate the stake distribution." }

export function StakeDistributionEqualityCard({
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

  const q = latest ? qualitative(latest.gini) : null

  return (
    <MetricCard
      className="h-full"
      title="Stake Distribution"
      description="Gini coefficient of operator stake weight (0 = perfectly equal, 1 = perfectly unequal). Complements Nakamoto with a continuous measure."
      legend={[{ label: "Gini", color: COLOR }]}
      value={latest ? `Gini ${formatter.number(latest.gini, 2)}` : null}
      context={q?.label}
      interpretation={q?.interp}
      loading={loading}
    >
      <ChartContainer
        className={METRIC_CHART_CLASS}
        config={{ gini: { color: COLOR, label: "Gini" } }}
      >
        <LineChart data={rows} margin={METRIC_CHART_MARGIN}>
          <CartesianGrid {...METRIC_GRID_PROPS} />
          <YAxis hide domain={[0, 1]} />
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
                valueFormatter={(v) => formatter.number(Number(v), 3)}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="gini"
            stroke={COLOR}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </MetricCard>
  )
}
