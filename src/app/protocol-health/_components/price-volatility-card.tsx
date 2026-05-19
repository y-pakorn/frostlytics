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

import { EmptyChartState } from "@/components/ui/empty-chart-state"
import { MetricCard } from "@/components/ui/metric-card"
import { stddev } from "./stats"
import { filterByRange, type Timerange } from "./timerange-picker"
import type { ProtocolHealthDaily } from "@/hooks/use-protocol-health"

const STORAGE_COLOR = "var(--color-accent-blue)"
const WRITE_COLOR = "var(--color-brand-400)"

export function PriceVolatilityCard({
  daily,
  range,
  loading,
}: {
  daily: ProtocolHealthDaily[]
  range: Timerange
  loading?: boolean
}) {
  const { rows, latest, sd, hasData } = useMemo(() => {
    // Use raw FROST units (base units, 9 decimals on WAL). Displaying in WAL
    // divides by 1e9, which renders typical price values as 0.0000055 and
    // formats to "0" — meaningless to readers. Raw units preserve precision.
    const rows = filterByRange(daily, range).map((d) => ({
      timestamp: d.timestamp,
      storagePrice: d.storagePrice,
      writePrice: d.writePrice,
    }))
    const storageVals = rows
      .map((d) => d.storagePrice)
      .filter((v): v is number => v != null)
    const writeVals = rows
      .map((d) => d.writePrice)
      .filter((v): v is number => v != null)
    const sd = (stddev(storageVals) + stddev(writeVals)) / 2
    const latest = rows[rows.length - 1]
    const hasData = storageVals.length > 0 || writeVals.length > 0
    return { rows, latest, sd, hasData }
  }, [daily, range])

  return (
    <MetricCard
      className="h-full"
      title="Price Volatility"
      description="Storage and write prices in raw FROST units (base units). Steady values indicate cost stability."
      legend={[
        { label: "Storage", color: STORAGE_COLOR },
        { label: "Write", color: WRITE_COLOR },
      ]}
      value={
        latest && hasData
          ? `σ ${formatter.numberReadable(sd, 0)}`
          : null
      }
      valueSuffix={hasData ? "FROST" : undefined}
      context={
        latest && hasData
          ? `S ${formatter.numberReadable(latest.storagePrice ?? 0, 0)} · W ${formatter.numberReadable(latest.writePrice ?? 0, 0)}`
          : null
      }
      interpretation={
        hasData
          ? sd === 0
            ? "Prices are constant across the visible range."
            : "Storage and write prices change in lockstep — typical for governance-set pricing."
          : undefined
      }
      loading={loading}
    >
      {!hasData ? (
        <EmptyChartState message="No price data in selected range" />
      ) : (
        <ChartContainer
          className={METRIC_CHART_CLASS}
          config={{
            storagePrice: { color: STORAGE_COLOR, label: "Storage" },
            writePrice: { color: WRITE_COLOR, label: "Write" },
          }}
        >
          <LineChart
            data={rows}
            margin={METRIC_CHART_MARGIN}
          >
            <CartesianGrid {...METRIC_GRID_PROPS} />
            <YAxis hide domain={["dataMin", "dataMax"]} />
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
                  valueFormatter={(v) => formatter.numberReadable(v, 0)}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="storagePrice"
              stroke={STORAGE_COLOR}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="writePrice"
              stroke={WRITE_COLOR}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </MetricCard>
  )
}
