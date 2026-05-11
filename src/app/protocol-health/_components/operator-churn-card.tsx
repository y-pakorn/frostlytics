"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatter } from "@/lib/formatter"

import { EmptyChartState } from "./empty-chart-state"
import { MetricCard } from "./metric-card"
import type { Timerange } from "./timerange-picker"
import type { ProtocolHealthChurn } from "@/hooks/use-protocol-health"

const JOINED_COLOR = "var(--color-success-foreground)"
const EXITED_COLOR = "var(--color-error-foreground)"

const shortId = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`

export function OperatorChurnCard({
  churn,
  loading,
}: {
  churn: ProtocolHealthChurn[]
  range: Timerange
  loading?: boolean
}) {
  const { series, net30, recentJoined, recentExited } = useMemo(() => {
    // Show last 30 epochs in the chart regardless of range — churn cadence is
    // epoch-paced, not day-paced.
    const series = churn.slice(-30).map((c) => ({
      epoch: c.epoch,
      joined: c.joined,
      exited: -c.exited,
    }))
    const net30 = churn
      .slice(-30)
      .reduce((a, c) => a + c.joined - c.exited, 0)
    const joinedFlat = churn.flatMap((c) =>
      c.joinedIds.map((id) => ({ id, epoch: c.epoch }))
    )
    const exitedFlat = churn.flatMap((c) =>
      c.exitedIds.map((id) => ({ id, epoch: c.epoch }))
    )
    const recentJoined = joinedFlat.slice(-3).reverse()
    const recentExited = exitedFlat.slice(-3).reverse()
    return { series, net30, recentJoined, recentExited }
  }, [churn])

  return (
    <MetricCard
      title="Operator Retention & Churn"
      description="Operators joining and exiting per epoch, with the most recent IDs surfaced. Tracks operator-set stability."
      legend={[
        { label: "Joined", color: JOINED_COLOR },
        { label: "Exited", color: EXITED_COLOR },
      ]}
      value={
        churn.length ? (
          <span
            className={
              net30 >= 0
                ? "text-success-foreground"
                : "text-error-foreground"
            }
          >
            {net30 >= 0 ? "+" : ""}
            {formatter.number(net30, 0)}
          </span>
        ) : null
      }
      valueSuffix="net 30 ep"
      context={
        churn.length
          ? `${churn.length} total epochs tracked`
          : null
      }
      interpretation={
        churn.length
          ? net30 === 0
            ? "Operator set is exactly balanced across the last 30 epochs."
            : net30 > 0
              ? `Net growth of ${formatter.number(net30, 0)} operators over the last 30 epochs.`
              : `Net loss of ${formatter.number(-net30, 0)} operators over the last 30 epochs.`
          : undefined
      }
      loading={loading}
    >
      {series.length === 0 ? (
        <EmptyChartState message="No churn history yet" />
      ) : (
        <div className="flex h-full flex-col gap-2">
          <ChartContainer
            watermark={false}
            className="h-[120px] w-full"
            config={{
              joined: { color: JOINED_COLOR, label: "Joined" },
              exited: { color: EXITED_COLOR, label: "Exited" },
            }}
          >
            <BarChart
              data={series}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              stackOffset="sign"
            >
              <CartesianGrid vertical={false} strokeOpacity={0.1} />
              <YAxis hide />
              <XAxis
                dataKey="epoch"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v) => `Ep ${v}`}
                tick={{ fontSize: 10 }}
              />
              <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.25} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    valueFormatter={(v) =>
                      formatter.number(Math.abs(Number(v)), 0)
                    }
                  />
                }
              />
              <Bar dataKey="joined" fill={JOINED_COLOR} radius={[2, 2, 0, 0]} />
              <Bar dataKey="exited" fill={EXITED_COLOR} radius={[0, 0, 2, 2]} />
            </BarChart>
          </ChartContainer>
          {(recentJoined.length || recentExited.length) > 0 ? (
            <div className="text-secondary-foreground grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-0.5">
                <div className="text-success-foreground font-semibold">
                  Recently joined
                </div>
                {recentJoined.length ? (
                  recentJoined.map((j) => (
                    <div key={`j-${j.epoch}-${j.id}`} className="truncate">
                      Ep {j.epoch} · {shortId(j.id)}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-error-foreground font-semibold">
                  Recently exited
                </div>
                {recentExited.length ? (
                  recentExited.map((e) => (
                    <div key={`e-${e.epoch}-${e.id}`} className="truncate">
                      Ep {e.epoch} · {shortId(e.id)}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </MetricCard>
  )
}
