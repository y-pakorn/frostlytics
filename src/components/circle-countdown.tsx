import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function CircleCountdown({
  className,
  ...props
}: ComponentProps<"div">) {
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

          const x1 = 50 + innerRadius * Math.cos((angle * Math.PI) / 180)
          const y1 = 50 + innerRadius * Math.sin((angle * Math.PI) / 180)
          const x2 = 50 + outerRadius * Math.cos((angle * Math.PI) / 180)
          const y2 = 50 + outerRadius * Math.sin((angle * Math.PI) / 180)

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
        <div className="bg-accent-purple rounded-full px-3 py-1 text-xs font-bold">
          Epoch 9
        </div>
        <div className="text-tertiary-foreground text-sm">Next Reward in</div>
        <div className="text-4xl font-bold">
          5d
          <br />
          <span className="text-3xl">24h 02m 24s</span>
        </div>
        <div className="text-quaternary-foreground text-sm">
          17 Aug 2025 05:45 PM
        </div>
      </div>
    </div>
  )
}
