"use client"

import { useMemo, type ReactNode } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, YAxis } from "recharts"

import { ChartContainer } from "@/components/ui/chart"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"

import { paddedDomain } from "./chart-styles"

export function HeroKpi({
  label,
  value,
  context,
  delta,
  sparkline,
  trendColor = "var(--color-brand-400)",
  loading,
  className,
}: {
  label: string
  value: ReactNode
  context?: ReactNode
  delta?: { value: number; label?: string } | null
  sparkline?: (number | null)[]
  trendColor?: string
  loading?: boolean
  className?: string
}) {
  const gradientId = `hero-spark-${label.replace(/[^a-z0-9]/gi, "")}`

  const sparkDomain = useMemo(
    () => paddedDomain(sparkline ?? []),
    [sparkline]
  )

  const showSparkline = !loading && sparkline && sparkline.length > 1

  return (
    <GlassCard
      tone="chart"
      className={cn("flex h-full flex-col", className)}
      contentClassName="flex flex-1 flex-col gap-3 p-4"
      innerClassName="flex flex-1 flex-col gap-3"
    >
      <p className="text-brand-300 text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </p>

      <div className="space-y-1">
        {loading ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <p className="font-heading text-foreground text-2xl font-bold leading-none tracking-[-0.01em]">
            {value}
          </p>
        )}
        {!loading && (delta || context) ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
            {delta ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  delta.value >= 0
                    ? "text-success-foreground"
                    : "text-error-foreground"
                )}
              >
                {delta.value >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {formatter.percentage(delta.value, {
                  mantissa: 1,
                  forceSign: true,
                })}
              </span>
            ) : null}
            {context ? <span className="text-tertiary">{context}</span> : null}
          </div>
        ) : null}
      </div>

      {showSparkline ? (
        <div className="mt-auto h-9 w-full shrink-0">
          <ChartContainer
            className="!aspect-auto h-full w-full"
            config={{ v: { color: trendColor } }}
          >
            <AreaChart
              data={sparkline.map((v, i) => ({ i, v }))}
              margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
            >
              <YAxis hide domain={sparkDomain} />
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={trendColor}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      ) : null}
    </GlassCard>
  )
}
