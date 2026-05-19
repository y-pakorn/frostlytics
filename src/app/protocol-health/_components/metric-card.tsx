import { Info, TrendingDown, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"

import { Surface } from "@/components/ui/surface"
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
}) {
  return (
    <Surface
      className={cn(
        "flex h-full min-h-[280px] flex-col gap-2 p-5",
        // Bump card surface contrast locally without touching shared component.
        "!bg-[linear-gradient(180deg,hsla(237,37%,8%,0.55)_0%,hsla(254,36%,24%,0.4)_100%)]",
        className
      )}
    >
      {/* Title row — label + info icon + legend */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-secondary-foreground text-[11px] font-medium uppercase tracking-wider">
            {title}
          </span>
          {description ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${title}`}
                  className="text-secondary-foreground hover:text-foreground transition-colors"
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
        {legend && legend.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
            {legend.map((item) => (
              <div
                key={item.label}
                className="text-secondary-foreground flex items-center gap-1 text-[10px]"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Hero number row */}
      <div>
        {loading ? (
          <Skeleton className="h-8 w-40" />
        ) : (
          <>
            <div className="text-foreground flex flex-wrap items-baseline gap-x-1.5 text-2xl font-bold leading-tight">
              {value ?? <span className="text-secondary-foreground">—</span>}
              {valueSuffix ? (
                <span className="text-secondary-foreground text-sm font-medium">
                  {valueSuffix}
                </span>
              ) : null}
            </div>
            <div className="text-secondary-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
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
                    <span className="text-secondary-foreground ml-0.5 font-normal">
                      {delta.label}
                    </span>
                  ) : null}
                </span>
              ) : null}
              {context ? <span>{context}</span> : null}
            </div>
          </>
        )}
      </div>

      {/* Chart slot */}
      <div className="min-h-[160px] flex-1">
        {loading ? <Skeleton className="h-[160px] w-full" /> : children}
      </div>

      {/* Plain-English interpretation */}
      {!loading && interpretation ? (
        <div className="text-secondary-foreground border-t border-white/5 pt-2 text-[11px] italic">
          {interpretation}
        </div>
      ) : null}
    </Surface>
  )
}
