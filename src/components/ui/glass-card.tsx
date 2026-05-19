import { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"
import { LiquidGlass } from "@/components/ui/liquid-glass"

export type GlassCardTone =
  | "hero"
  | "epoch-success"
  | "epoch-error"
  | "storage"
  | "chart"

export function GlassCard({
  tone = "hero",
  className,
  contentClassName,
  innerClassName,
  children,
  ...props
}: ComponentProps<"div"> & {
  tone?: GlassCardTone
  contentClassName?: string
  innerClassName?: string
  children: ReactNode
}) {
  return (
    <LiquidGlass
      opaque={false}
      className={cn("glass-card h-full w-full", className)}
      contentClassName={cn(
        "relative flex h-full min-h-full flex-col overflow-hidden p-[var(--glass-card-padding)] text-foreground",
        contentClassName
      )}
      {...props}
    >
      <div className="glass-card-tone" data-tone={tone} aria-hidden />
      <div
        className={cn(
          "glass-card-inner flex min-h-0 flex-1 flex-col",
          innerClassName
        )}
      >
        {children}
      </div>
    </LiquidGlass>
  )
}
