import { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"
import { LiquidGlass } from "@/components/ui/liquid-glass"

export type HomeCardTone =
  | "hero"
  | "epoch-success"
  | "epoch-error"
  | "storage"
  | "chart"

export function HomeGlassCard({
  tone = "hero",
  className,
  contentClassName,
  innerClassName,
  children,
  ...props
}: ComponentProps<"div"> & {
  tone?: HomeCardTone
  contentClassName?: string
  innerClassName?: string
  children: ReactNode
}) {
  return (
    <LiquidGlass
      opaque={false}
      className={cn("home-glass-card h-full w-full", className)}
      contentClassName={cn(
        "relative flex h-full min-h-full flex-col overflow-hidden p-[var(--home-card-padding)] text-foreground",
        contentClassName
      )}
      {...props}
    >
      <div className="home-card-tone" data-tone={tone} aria-hidden />
      <div
        className={cn(
          "home-card-inner flex min-h-0 flex-1 flex-col",
          innerClassName
        )}
      >
        {children}
      </div>
    </LiquidGlass>
  )
}
