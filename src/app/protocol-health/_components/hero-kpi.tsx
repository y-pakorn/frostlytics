"use client"

import type { ReactNode } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart } from "recharts"

import { GradientBorderCard } from "@/components/gradient-border-card"
import { ChartContainer } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"

export function HeroKpi({
  label,
  value,
  context,
  delta,
  sparkline,
  trendColor = "var(--color-accent-purple)",
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
  return (
    <GradientBorderCard
      className={cn(
        "relative flex min-h-[140px] flex-col justify-between gap-2 overflow-hidden p-5",
        "!bg-[linear-gradient(180deg,hsla(237,37%,8%,0.55)_0%,hsla(254,36%,24%,0.4)_100%)]",
        className
      )}
    >
      <div className="text-secondary-foreground relative z-10 text-[10px] font-medium uppercase tracking-wider">
        {label}
      </div>
      <div className="relative z-10 space-y-1.5">
        {loading ? (
          <Skeleton className="h-9 w-36" />
        ) : (
          <div className="text-foreground text-3xl font-bold leading-tight">
            {value}
          </div>
        )}
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
          {context ? (
            <span className="text-secondary-foreground">{context}</span>
          ) : null}
        </div>
      </div>
      {/* Full-width sparkline anchored to bottom edge */}
      {sparkline && sparkline.length > 1 ? (
        <div className="absolute inset-x-0 bottom-0 z-0 h-[56px] opacity-70">
          <ChartContainer
            watermark={false}
            className="h-full w-full"
            config={{ v: { color: trendColor } }}
          >
            <AreaChart
              data={sparkline.map((v, i) => ({ i, v }))}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={trendColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      ) : null}
    </GradientBorderCard>
  )
}
