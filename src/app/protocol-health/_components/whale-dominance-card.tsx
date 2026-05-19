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

const TOP5_COLOR = "var(--color-accent-blue)"
const TOP10_COLOR = "var(--color-brand-400)"

export function WhaleDominanceCard({
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

  return (
    <MetricCard
      className="h-full"
      title="Whale Dominance"
      description="Combined network share of the top-5 and top-10 operators. Rising lines mean fewer entities control more weight."
      legend={[
        { label: "Top 5", color: TOP5_COLOR },
        { label: "Top 10", color: TOP10_COLOR },
      ]}
      value={
        latest
          ? formatter.percentage(latest.top5Share, { mantissa: 1 })
          : null
      }
      valueSuffix="top-5 share"
      context={
        latest
          ? `${formatter.percentage(latest.top10Share, { mantissa: 1 })} top-10`
          : null
      }
      interpretation={
        latest
          ? latest.top5Share > 0.5
            ? "Top 5 operators control a majority of weight — high concentration."
            : latest.top5Share > 0.33
              ? "Top 5 operators control over a third of weight — meaningful concentration."
              : "Top 5 share is contained — weight is spread across the active set."
          : undefined
      }
      loading={loading}
    >
      <ChartContainer
        watermark={false}
        className={METRIC_CHART_CLASS}
        config={{
          top5Share: { color: TOP5_COLOR, label: "Top 5" },
          top10Share: { color: TOP10_COLOR, label: "Top 10" },
        }}
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
                valueFormatter={(v) =>
                  formatter.percentage(Number(v), { mantissa: 1 })
                }
              />
            }
          />
          <Line
            type="monotone"
            dataKey="top5Share"
            stroke={TOP5_COLOR}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="top10Share"
            stroke={TOP10_COLOR}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </MetricCard>
  )
}
