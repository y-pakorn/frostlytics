"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"

import { MetricCard } from "./metric-card"
import { projectDaysUntil } from "./stats"
import { filterByRange, type Timerange } from "./timerange-picker"
import type { ProtocolHealthDaily } from "@/hooks/use-protocol-health"

const USED_COLOR = "var(--color-accent-blue)"
const TOTAL_COLOR = "var(--color-accent-purple)"

export function NetworkCapacityCard({
  daily,
  range,
  loading,
}: {
  daily: ProtocolHealthDaily[]
  range: Timerange
  loading?: boolean
}) {
  const { rows, latest, daysUntilFull, utilization } = useMemo(() => {
    const rows = filterByRange(daily, range)
    const latest = rows[rows.length - 1]
    const used = latest?.storageUsedTB ?? null
    const total = latest?.totalStorageTB ?? null
    const utilization = used != null && total ? used / total : null
    // Project from the last 90d regardless of selected range — projection is
    // about the network's actual trend, not the user's view window.
    const series = daily
      .filter((d) => d.storageUsedTB != null)
      .slice(-90)
      .map((d) => ({ t: new Date(d.timestamp).getTime(), y: d.storageUsedTB! }))
    const target = total ?? 0
    const daysUntilFull = target > 0 ? projectDaysUntil(series, target) : null
    return { rows, latest, daysUntilFull, utilization }
  }, [daily, range])

  return (
    <MetricCard
      title="Network Capacity"
      description="Used vs total storage with saturation forecast. Linear projection over the last 90 days of usage."
      legend={[
        { label: "Used", color: USED_COLOR },
        { label: "Total", color: TOTAL_COLOR },
      ]}
      value={
        daysUntilFull == null
          ? utilization != null
            ? formatter.percentage(utilization, { mantissa: 1 })
            : "—"
          : `~${formatter.number(daysUntilFull, 0)}d`
      }
      valueSuffix={daysUntilFull == null ? "utilized" : "to fill"}
      context={
        utilization != null
          ? `${formatter.percentage(utilization, { mantissa: 1 })} currently utilized`
          : null
      }
      interpretation={
        daysUntilFull != null && daysUntilFull < 180
          ? `At current growth rate, capacity will saturate in roughly ${formatter.number(daysUntilFull, 0)} days.`
          : daysUntilFull == null
            ? "Usage is flat or declining — no near-term saturation risk."
            : `Comfortable headroom — saturation more than ${formatter.number(daysUntilFull, 0)} days away.`
      }
      loading={loading}
    >
      <ChartContainer
        watermark={false}
        className="h-full w-full"
        config={{
          storageUsedTB: { color: USED_COLOR, label: "Used (TB)" },
          totalStorageTB: { color: TOTAL_COLOR, label: "Total (TB)" },
        }}
      >
        <AreaChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="capacity-used" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={USED_COLOR} stopOpacity={0.6} />
              <stop offset="95%" stopColor={USED_COLOR} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="capacity-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={TOTAL_COLOR} stopOpacity={0.25} />
              <stop offset="95%" stopColor={TOTAL_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeOpacity={0.1} />
          <YAxis hide domain={[0, "dataMax"]} />
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
              />
            }
          />
          <Area
            type="monotone"
            dataKey="totalStorageTB"
            stroke={TOTAL_COLOR}
            fill="url(#capacity-total)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="storageUsedTB"
            stroke={USED_COLOR}
            fill="url(#capacity-used)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </MetricCard>
  )
}
