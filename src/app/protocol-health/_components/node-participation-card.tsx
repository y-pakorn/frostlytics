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
import { deltaOver } from "./stats"
import { filterByRange, type Timerange } from "./timerange-picker"
import type { ProtocolHealthDaily } from "@/hooks/use-protocol-health"

const ACTIVE_COLOR = "var(--color-accent-blue)"
const COMMITTEE_COLOR = "var(--color-brand-400)"

export function NodeParticipationCard({
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
      daily.map((d) => d.activeCount),
      30
    )
    return { rows, latest, delta30 }
  }, [daily, range])

  return (
    <MetricCard
      className="h-full"
      title="Node Participation"
      description="Active operators and committee members over time. Tracks network expansion or contraction."
      legend={[
        { label: "Active", color: ACTIVE_COLOR },
        { label: "Committee", color: COMMITTEE_COLOR },
      ]}
      value={latest ? formatter.number(latest.activeCount ?? 0, 0) : null}
      valueSuffix="active"
      context={
        latest
          ? `${formatter.number(latest.committeeCount ?? 0, 0)} committee`
          : null
      }
      delta={delta30 != null ? { value: delta30, label: "vs 30d ago" } : null}
      interpretation={
        latest
          ? `${formatter.percentage((latest.committeeCount ?? 0) / Math.max(1, latest.activeCount ?? 1), { mantissa: 0 })} of active operators are on the committee.`
          : undefined
      }
      loading={loading}
    >
      <ChartContainer
        watermark={false}
        className={METRIC_CHART_CLASS}
        config={{
          activeCount: { color: ACTIVE_COLOR, label: "Active" },
          committeeCount: { color: COMMITTEE_COLOR, label: "Committee" },
        }}
      >
        <LineChart data={rows} margin={METRIC_CHART_MARGIN}>
          <CartesianGrid {...METRIC_GRID_PROPS} />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
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
            dataKey="activeCount"
            stroke={ACTIVE_COLOR}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="committeeCount"
            stroke={COMMITTEE_COLOR}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </MetricCard>
  )
}
