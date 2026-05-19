"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { EmptyChartState } from "@/components/ui/empty-chart-state"
import { MetricCard } from "@/components/ui/metric-card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useOperatorHistory } from "@/hooks/use-operator-history"
import type { OperatorHistoryPoint } from "@/hooks/use-operator-history"

type Range = "30d" | "90d" | "all"

const STAKE_COLOR = "var(--color-brand-400)"
const WEIGHT_COLOR = "var(--color-brand-400)"
const EARNINGS_COLOR = "var(--color-success-foreground)"

const CHART_CLASS =
  "!aspect-auto h-full min-h-[160px] w-full [&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:!w-full"
const CHART_MARGIN = { top: 4, right: 8, left: 0, bottom: 0 }
const AXIS_TICK = { fontSize: 10, fill: "var(--color-tertiary)" }
const TOOLTIP_CURSOR = {
  stroke: "var(--color-border-secondary)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
}

const RANGE_SUFFIX: Record<Range, string> = {
  "30d": "30d",
  "90d": "90d",
  all: "all time",
}

function sliceByRange(data: OperatorHistoryPoint[], range: Range) {
  if (range === "all") return data
  return data.slice(-(range === "30d" ? 30 : 90))
}

function paddedDomain(values: (number | null | undefined)[]): [number, number] {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  )
  if (!nums.length) return [0, 1]
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.08
    return [Math.max(0, min - pad), max + pad]
  }
  const pad = (max - min) * 0.12
  return [Math.max(0, min - pad), max + pad]
}

function barYDomain(values: (number | null | undefined)[]): [number, number] {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  )
  if (!nums.length) return [0, 1]
  const max = Math.max(...nums)
  const pad = max * 0.12 || 1
  return [0, max + pad]
}

function formatAxisDate(timestamp: string, pointCount: number) {
  const date = dayjs(timestamp)
  if (pointCount <= 35) return date.format("D MMM")
  if (pointCount <= 120) return date.format("MMM D")
  return date.format("MMM 'YY")
}

function RangeToggle({
  value,
  onChange,
}: {
  value: Range
  onChange: (value: Range) => void
}) {
  return (
    <SegmentedControl
      variant="figma"
      options={[
        { label: "30d", value: "30d" },
        { label: "90d", value: "90d" },
        { label: "All", value: "all" },
      ]}
      value={value}
      onChange={onChange}
    />
  )
}

export function OperatorHistorySection({
  operatorId,
  className,
}: {
  operatorId: string
  className?: string
}) {
  const [range, setRange] = useState<Range>("30d")
  const { data, isLoading } = useOperatorHistory(operatorId)
  const history = data?.history ?? []

  const chartData = useMemo(
    () => sliceByRange(history, range),
    [history, range]
  )

  const { earningsTotal, latestStake, latestWeightPct } = useMemo(() => {
    const earningsTotal = chartData.reduce(
      (total, point) => total + (point.estimatedEarningsWAL ?? 0),
      0
    )
    const latest = history[history.length - 1]
    return {
      earningsTotal,
      latestStake: latest?.stakedWAL ?? null,
      latestWeightPct: latest?.weightPercentage ?? null,
    }
  }, [chartData, history])

  const stakeDomain = useMemo(
    () => paddedDomain(chartData.map((point) => point.stakedWAL)),
    [chartData]
  )
  const weightDomain = useMemo(
    () => paddedDomain(chartData.map((point) => point.weightPercentage)),
    [chartData]
  )
  const earningsDomain = useMemo(
    () =>
      barYDomain(chartData.map((point) => point.estimatedEarningsWAL)),
    [chartData]
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex justify-end">
        <RangeToggle value={range} onChange={setRange} />
      </div>
      <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-3">
        <MetricCard
          chartSize="md"
          className="h-full"
          title="Staked WAL"
          description="This operator's total staked WAL over time."
          legend={[{ label: "Staked WAL", color: STAKE_COLOR }]}
          value={
            latestStake != null
              ? formatter.numberReadable(latestStake, 2)
              : null
          }
          valueSuffix="WAL"
          loading={isLoading}
        >
          {chartData.length < 2 ? (
            <EmptyChartState
              message="Not enough history yet"
              className="h-full"
            />
          ) : (
            <ChartContainer
              className={CHART_CLASS}
              config={{
                stakedWAL: { color: STAKE_COLOR, label: "Staked WAL" },
              }}
            >
              <AreaChart data={chartData} margin={CHART_MARGIN}>
                <defs>
                  <linearGradient
                    id="op-stake-history"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={STAKE_COLOR}
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="100%"
                      stopColor={STAKE_COLOR}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border-secondary)"
                  strokeOpacity={0.35}
                  strokeDasharray="3 6"
                />
                <YAxis hide domain={stakeDomain} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={AXIS_TICK}
                  tickFormatter={(value) =>
                    formatAxisDate(String(value), chartData.length)
                  }
                  minTickGap={32}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={TOOLTIP_CURSOR}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      includeDate={{
                        key: "timestamp",
                        formatter: (value) =>
                          dayjs(value).format("MMM D, YYYY"),
                      }}
                      valueFormatter={(value) =>
                        `${formatter.numberReadable(Number(value), 2)} WAL`
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="stakedWAL"
                  stroke={STAKE_COLOR}
                  fill="url(#op-stake-history)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: STAKE_COLOR,
                    stroke: "var(--color-background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </MetricCard>

        <MetricCard
          chartSize="md"
          className="h-full"
          title="Voting Weight"
          description="Share of total network weight controlled by this operator over time."
          legend={[{ label: "Weight share", color: WEIGHT_COLOR }]}
          value={
            latestWeightPct != null
              ? formatter.percentage(latestWeightPct, { mantissa: 2 })
              : null
          }
          valueSuffix="share"
          loading={isLoading}
        >
          {chartData.length < 2 ? (
            <EmptyChartState
              message="Not enough history yet"
              className="h-full"
            />
          ) : (
            <ChartContainer
              className={CHART_CLASS}
              config={{
                weightPercentage: {
                  color: WEIGHT_COLOR,
                  label: "Weight share",
                },
              }}
            >
              <AreaChart data={chartData} margin={CHART_MARGIN}>
                <defs>
                  <linearGradient
                    id="op-weight-history"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={WEIGHT_COLOR}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={WEIGHT_COLOR}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border-secondary)"
                  strokeOpacity={0.35}
                  strokeDasharray="3 6"
                />
                <YAxis hide domain={weightDomain} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={AXIS_TICK}
                  tickFormatter={(value) =>
                    formatAxisDate(String(value), chartData.length)
                  }
                  minTickGap={32}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={TOOLTIP_CURSOR}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      includeDate={{
                        key: "timestamp",
                        formatter: (value) =>
                          dayjs(value).format("MMM D, YYYY"),
                      }}
                      valueFormatter={(value) =>
                        formatter.percentage(Number(value), { mantissa: 2 })
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="weightPercentage"
                  stroke={WEIGHT_COLOR}
                  fill="url(#op-weight-history)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: WEIGHT_COLOR,
                    stroke: "var(--color-background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </MetricCard>

        <MetricCard
          chartSize="md"
          className="h-full"
          title="Est. Earnings"
          description="Estimated WAL earned per epoch (weight share × user fees). Excludes commission and is a proxy, not on-chain settlement."
          legend={[{ label: "WAL / day", color: EARNINGS_COLOR }]}
          value={
            chartData.length
              ? formatter.numberReadable(earningsTotal, 2)
              : null
          }
          valueSuffix={`WAL · ${RANGE_SUFFIX[range]}`}
          loading={isLoading}
        >
          {chartData.length < 2 ? (
            <EmptyChartState
              message="Not enough history yet"
              className="h-full"
            />
          ) : (
            <ChartContainer
              className={CHART_CLASS}
              config={{
                estimatedEarningsWAL: {
                  color: EARNINGS_COLOR,
                  label: "WAL / day",
                },
              }}
            >
              <BarChart
                data={chartData}
                margin={CHART_MARGIN}
                barCategoryGap="28%"
              >
                <defs>
                  <linearGradient
                    id="op-earnings-bar"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={EARNINGS_COLOR}
                      stopOpacity={0.95}
                    />
                    <stop
                      offset="100%"
                      stopColor={EARNINGS_COLOR}
                      stopOpacity={0.35}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border-secondary)"
                  strokeOpacity={0.35}
                  strokeDasharray="3 6"
                />
                <YAxis hide domain={earningsDomain} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={AXIS_TICK}
                  tickFormatter={(value) =>
                    formatAxisDate(String(value), chartData.length)
                  }
                  minTickGap={32}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      includeDate={{
                        key: "timestamp",
                        formatter: (value) =>
                          dayjs(value).format("MMM D, YYYY"),
                      }}
                      valueFormatter={(value) =>
                        `${formatter.numberReadable(Number(value), 4)} WAL`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="estimatedEarningsWAL"
                  fill="url(#op-earnings-bar)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
              </BarChart>
            </ChartContainer>
          )}
        </MetricCard>
      </div>
    </div>
  )
}
