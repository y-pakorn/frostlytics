import { ComponentProps, useEffect, useMemo, useState } from "react"

import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useStaking } from "@/hooks"

import { Skeleton } from "./ui/skeleton"

export function CircleCountdown({
  className,
  ...props
}: ComponentProps<"div">) {
  const staking = useStaking()

  const [remaining, setRemaining] = useState<{
    d: number
    h: number
    m: number
    s: number
  }>({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
  })

  useEffect(() => {
    if (!staking) return

    const updateRemaining = () => {
      const now = Date.now()
      const end = staking.epochChangeDoneMs + staking.epochDurationMs
      let diff = end - now

      if (diff <= 0) {
        setRemaining({ d: 0, h: 0, m: 0, s: 0 })
        return
      }

      const d = Math.floor(diff / (24 * 60 * 60 * 1000))
      diff -= d * 24 * 60 * 60 * 1000
      const h = Math.floor(diff / (60 * 60 * 1000))
      diff -= h * 60 * 60 * 1000
      const m = Math.floor(diff / (60 * 1000))
      diff -= m * 60 * 1000
      const s = Math.floor(diff / 1000)

      setRemaining({ d, h, m, s })
    }

    updateRemaining()
    const interval = setInterval(updateRemaining, 1000)
    return () => clearInterval(interval)
  }, [staking])

  return (
    <div
      className={cn(
        "bg-accent-blue text-primary-foreground relative flex flex-col items-center justify-center gap-2 rounded-full text-center font-semibold",
        className
      )}
      {...props}
    >
      {/* Clock tick marks positioned inside the circle */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Generate 60 tick marks (12 major, 48 minor) */}
        {Array.from({ length: 60 }, (_, i) => {
          const angle = i * 6 - 90 // 6 degrees per tick, start from top
          const isMajor = i % 5 === 0 // Every 5th tick is major (12 total)
          const tickLength = isMajor ? 6 : 3 // Percentage of radius
          const tickWidth = 2
          const outerRadius = 50 // 50% of viewBox (circle edge)
          const innerRadius = outerRadius - tickLength

          const x1 =
            Math.round(
              (50 + innerRadius * Math.cos((angle * Math.PI) / 180)) * 1000
            ) / 1000
          const y1 =
            Math.round(
              (50 + innerRadius * Math.sin((angle * Math.PI) / 180)) * 1000
            ) / 1000
          const x2 =
            Math.round(
              (50 + outerRadius * Math.cos((angle * Math.PI) / 180)) * 1000
            ) / 1000
          const y2 =
            Math.round(
              (50 + outerRadius * Math.sin((angle * Math.PI) / 180)) * 1000
            ) / 1000

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={tickWidth}
              className={
                isMajor ? "text-accent-purple" : "text-primary-foreground"
              }
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>

      {/* Content on top of tick marks */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {staking ? (
          <div className="bg-accent-purple rounded-full px-3 py-1 text-xs font-bold">
            Epoch {staking.epoch}
          </div>
        ) : (
          <Skeleton className="bg-accent-foreground/60 h-6 w-16" />
        )}
        <div className="text-tertiary-foreground text-sm">Next Epoch in</div>

        {staking ? (
          <div className="text-4xl font-bold">
            {remaining?.d}d
            <br />
            <span className="text-3xl">
              {remaining?.h}h {remaining?.m}m {remaining?.s}s
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Skeleton className="bg-accent-foreground/60 h-10 w-14" />
            <Skeleton className="bg-accent-foreground/60 h-8 w-36" />
          </div>
        )}
        {staking ? (
          <div className="text-quaternary-foreground text-sm">
            {formatter.date(
              staking.epochChangeDoneMs + staking.epochDurationMs
            )}
          </div>
        ) : (
          <Skeleton className="bg-accent-foreground/60 h-5 w-24" />
        )}
      </div>
    </div>
  )
}
