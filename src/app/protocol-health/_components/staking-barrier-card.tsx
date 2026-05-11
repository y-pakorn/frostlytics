"use client"

import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"

import { MetricCard } from "./metric-card"
import { deltaOver } from "./stats"
import { filterByRange, type Timerange } from "./timerange-picker"
import type { ProtocolHealthDaily } from "@/hooks/use-protocol-health"

const COLOR = "var(--color-success-foreground)"

export function StakingBarrierCard({
  daily,
  range,
  loading,
}: {
  daily: ProtocolHealthDaily[]
  range: Timerange
  loading?: boolean
}) {
  const { rows, latest, delta90 } = useMemo(() => {
    const rows = filterByRange(daily, range)
    const latest = rows[rows.length - 1]
    const delta90 = deltaOver(
      daily.map((d) => d.averageStakedWAL),
      90
    )
    return { rows, latest, delta90 }
  }, [daily, range])

  return (
    <MetricCard
      title="Staking Barrier"
      description="Average WAL staked per active node. Rising values mean new operators must commit more capital to compete."
      legend={[{ label: "Avg stake / node", color: COLOR }]}
      value={
        latest
          ? formatter.numberReadable(latest.averageStakedWAL ?? 0, 2)
          : null
      }
      valueSuffix="WAL / node"
      delta={delta90 != null ? { value: delta90, label: "vs 90d ago" } : null}
      interpretation={
        delta90 != null
          ? delta90 > 0.1
            ? "Barrier to entry is rising — new operators face higher capital requirements."
            : delta90 < -0.1
              ? "Barrier is falling — easier for new operators to enter the active set."
              : "Barrier is roughly stable over the last 90 days."
          : undefined
      }
      loading={loading}
    >
      <ChartContainer
        watermark={false}
        className="h-full w-full"
        config={{ averageStakedWAL: { color: COLOR, label: "Avg WAL" } }}
      >
        <LineChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.1} />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <XAxis
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(v) => dayjs(v).format("MMM D")}
            tick={{ fontSize: 10 }}
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
                  `${formatter.numberReadable(v, 2)} WAL`
                }
              />
            }
          />
          <Line
            type="monotone"
            dataKey="averageStakedWAL"
            stroke={COLOR}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </MetricCard>
  )
}
