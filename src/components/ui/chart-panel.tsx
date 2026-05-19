import { ReactNode } from "react"

import { GlassCard } from "@/components/ui/glass-card"

export function ChartPanel({
  title,
  action,
  height = 233,
  className,
  children,
}: {
  title: string
  action?: ReactNode
  height?: number
  className?: string
  children: ReactNode
}) {
  return (
    <GlassCard
      tone="chart"
      className={className}
      innerClassName="h-full gap-2"
      contentClassName="px-4 py-3"
      style={{ minHeight: height }}
    >
      <div className="flex shrink-0 items-center justify-between">
        <p className="text-brand-300 text-sm font-semibold">{title}</p>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </GlassCard>
  )
}
