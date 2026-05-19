import { Info, TrendingDown, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"

import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"

export type LegendItem = {
  label: string
  color: string
}

export type DeltaInfo = {
  value: number // 0–1 fraction, signed
  label?: string // e.g. "vs 30d ago"
}

export function MetricCard({
  title,
  description,
  legend,
  value,
  valueSuffix,
  context,
  delta,
  interpretation,
  loading,
  children,
  className,
  action,
  chartSize = "sm",
}: {
  title: string
  description?: string
  legend?: LegendItem[]
  value?: ReactNode
  valueSuffix?: string
  context?: ReactNode
  delta?: DeltaInfo | null
  interpretation?: ReactNode
  loading?: boolean
  children: ReactNode
  className?: string
  action?: ReactNode
  chartSize?: "sm" | "md"
}) {
  return (
    <GlassCard
      tone="chart"
      className={cn(
        "flex h-full flex-col",
        chartSize === "md" && "min-h-[320px]",
        className
      )}
      contentClassName="flex h-full min-h-0 flex-col gap-1.5 px-4 pt-4 pb-4"
      innerClassName="flex h-full min-h-0 flex-1 flex-col gap-1.5"
    >
      {/* Title row — label + info icon + legend + action */}
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-brand-300 text-sm font-semibold">{title}</span>
          {description ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${title}`}
                  className="text-tertiary hover:text-foreground transition-colors"
                >
                  <Info className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[min(260px,calc(100vw-2rem))] text-left">
                {description}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          {legend && legend.length > 0
            ? legend.map((item) => (
                <div
                  key={item.label}
                  className="text-tertiary flex items-center gap-1 text-xs"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </div>
              ))
            : null}
          {action}
        </div>
      </div>

      {/* Hero number row — fixed min height keeps chart slots aligned across cards */}
      <div className="shrink-0">
        {loading ? (
          <Skeleton className="h-8 w-40" />
        ) : (
          <>
            <div className="text-foreground flex flex-wrap items-baseline gap-x-1.5 text-xl font-bold leading-tight">
              {value ?? <span className="text-tertiary">—</span>}
              {valueSuffix ? (
                <span className="text-tertiary text-sm font-medium">
                  {valueSuffix}
                </span>
              ) : null}
            </div>
            {delta || context ? (
              <div className="text-tertiary mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
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
                    {delta.label ? (
                      <span className="text-tertiary ml-0.5 font-normal">
                        {delta.label}
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {context ? <span>{context}</span> : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Chart slot — absolute fill gives Recharts a definite height in flex layouts */}
      <div
        className={cn(
          "relative min-h-0 flex-1",
          chartSize === "md" ? "min-h-[160px]" : "min-h-[100px]"
        )}
      >
        {loading ? (
          <Skeleton className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="absolute inset-0 min-h-0 [&_[data-slot=chart]]:h-full [&_[data-slot=chart]]:min-h-0">
            {children}
          </div>
        )}
      </div>

      {!loading && interpretation ? (
        <div className="text-tertiary shrink-0 border-t border-white/5 pt-2 text-[11px] italic">
          {interpretation}
        </div>
      ) : null}
    </GlassCard>
  )
}
