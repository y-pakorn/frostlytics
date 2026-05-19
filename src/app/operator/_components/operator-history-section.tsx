"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatter } from "@/lib/formatter"
import { useOperatorHistory } from "@/hooks/use-operator-history"

import { EmptyChartState } from "@/components/ui/empty-chart-state"
import { MetricCard } from "@/components/ui/metric-card"

const STAKE_COLOR = "var(--color-brand-400)"
const WEIGHT_COLOR = "var(--color-brand-400)"
const EARNINGS_COLOR = "var(--color-success-foreground)"

export function OperatorHistorySection({ operatorId }: { operatorId: string }) {
  const { data, isLoading } = useOperatorHistory(operatorId)
  const history = data?.history ?? []

  const { earnings30Total, latestStake, latestWeightPct } = useMemo(() => {
    const earnings30Total = history
      .slice(-30)
      .reduce((a, p) => a + (p.estimatedEarningsWAL ?? 0), 0)
    const latest = history[history.length - 1]
    return {
      earnings30Total,
      latestStake: latest?.stakedWAL ?? null,
      latestWeightPct: latest?.weightPercentage ?? null,
    }
  }, [history])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Staked WAL */}
      <MetricCard
        title="Staked WAL History"
        description="This operator's total staked WAL over time."
        legend={[{ label: "Staked WAL", color: STAKE_COLOR }]}
        value={
          latestStake != null
            ? formatter.numberReadable(latestStake, 2)
            : null
        }
        valueSuffix="WAL"
        context={
          data?.tenureEpochs
            ? `${formatter.number(data.tenureEpochs, 0)} epochs tracked`
            : null
        }
        loading={isLoading}
      >
        {history.length < 2 ? (
          <EmptyChartState message="Not enough history yet" />
        ) : (
          <ChartContainer
            watermark={false}
            className="h-full w-full"
            config={{ stakedWAL: { color: STAKE_COLOR, label: "Staked WAL" } }}
          >
            <AreaChart
              data={history}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="op-stake-history"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={STAKE_COLOR} stopOpacity={0.7} />
                  <stop
                    offset="95%"
                    stopColor={STAKE_COLOR}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeOpacity={0.1} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <XAxis
                dataKey="epoch"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v) => `Ep ${v}`}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    valueFormatter={(v) =>
                      `${formatter.numberReadable(v, 2)} WAL`
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="stakedWAL"
                stroke={STAKE_COLOR}
                fill="url(#op-stake-history)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </MetricCard>

      {/* Voting Weight */}
      <MetricCard
        title="Voting Weight History"
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
        {history.length < 2 ? (
          <EmptyChartState message="Not enough history yet" />
        ) : (
          <ChartContainer
            watermark={false}
            className="h-full w-full"
            config={{
              weightPercentage: {
                color: WEIGHT_COLOR,
                label: "Weight share",
              },
            }}
          >
            <LineChart
              data={history}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeOpacity={0.1} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <XAxis
                dataKey="epoch"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v) => `Ep ${v}`}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    valueFormatter={(v) =>
                      formatter.percentage(Number(v), { mantissa: 2 })
                    }
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="weightPercentage"
                stroke={WEIGHT_COLOR}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </MetricCard>

      {/* Estimated Earnings */}
      <MetricCard
        title="Estimated Earnings"
        description="Estimated WAL earned per epoch (weight share × user fees). Excludes commission and is a proxy, not on-chain settlement."
        legend={[{ label: "WAL / epoch", color: EARNINGS_COLOR }]}
        value={
          history.length
            ? formatter.numberReadable(earnings30Total, 2)
            : null
        }
        valueSuffix="WAL · last 30 ep"
        loading={isLoading}
      >
        {history.length < 2 ? (
          <EmptyChartState message="Not enough history yet" />
        ) : (
          <ChartContainer
            watermark={false}
            className="h-full w-full"
            config={{
              estimatedEarningsWAL: {
                color: EARNINGS_COLOR,
                label: "WAL / epoch",
              },
            }}
          >
            <BarChart
              data={history}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeOpacity={0.1} />
              <YAxis hide domain={[0, "dataMax"]} />
              <XAxis
                dataKey="epoch"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                tickFormatter={(v) => `Ep ${v}`}
                tick={{ fontSize: 10 }}
                type="category"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    valueFormatter={(v) =>
                      `${formatter.numberReadable(v, 4)} WAL`
                    }
                  />
                }
              />
              <Bar
                dataKey="estimatedEarningsWAL"
                fill={EARNINGS_COLOR}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </MetricCard>
    </div>
  )
}
