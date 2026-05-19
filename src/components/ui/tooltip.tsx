"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

const tooltipContentClasses = cn(
  "text-foreground animate-in fade-in-0 zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
  "data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2",
  "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
  "data-[side=top]:slide-in-from-bottom-2 z-[200] w-fit max-w-xs",
  "origin-(--radix-tooltip-content-transform-origin) text-balance"
)

const glassTooltipContentClasses = cn(
  "text-foreground z-[200] outline-none",
  "animate-in fade-in-0 zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
  "data-[state=closed]:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2",
  "data-[side=left]:slide-in-from-right-2",
  "data-[side=right]:slide-in-from-left-2",
  "data-[side=top]:slide-in-from-bottom-2",
  "origin-(--radix-tooltip-content-transform-origin)"
)

/** Self-contained glass surface — avoids LiquidGlass material layer artifacts in tooltips. */
const GlassTooltipSurface = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function GlassTooltipSurface({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative min-w-[240px] max-w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl",
        "bg-[rgba(12,14,18,0.94)] backdrop-blur-[24px] backdrop-saturate-[1.2]",
        "shadow-[var(--shadow-elevated),inset_0_1px_2px_rgba(255,255,255,0.2)]",
        "ring-1 ring-white/[0.12]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  hasArrow = false,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  hasArrow?: boolean
  variant?: "default" | "glass"
}) {
  return (
    <TooltipPrimitive.Portal>
      {variant === "glass" ? (
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          sideOffset={sideOffset}
          className={cn(glassTooltipContentClasses, className)}
          {...props}
          asChild
        >
          <GlassTooltipSurface className="pointer-events-auto p-4">
            <div className="space-y-3">{children}</div>
          </GlassTooltipSurface>
        </TooltipPrimitive.Content>
      ) : (
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          sideOffset={sideOffset}
          className={cn(
            tooltipContentClasses,
            "bg-accent border-popover-border rounded-md border px-3 py-1.5 text-xs",
            className
          )}
          {...props}
        >
          {children}
          {hasArrow && (
            <TooltipPrimitive.Arrow className="bg-accent fill-accent z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
          )}
        </TooltipPrimitive.Content>
      )}
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
