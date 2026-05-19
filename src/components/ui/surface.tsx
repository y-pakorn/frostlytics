import { cva, type VariantProps } from "class-variance-authority"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

import { LiquidGlass } from "./liquid-glass"

const surfaceVariants = cva(
  "text-secondary-foreground min-w-0 rounded-2xl text-sm font-semibold",
  {
    variants: {
      variant: {
        /** Figma chart/bg-primary — elevated card panel */
        default: "border border-border-secondary bg-surface-elevated p-4",
        glass: "p-0",
        hero: "border border-brand-800/30 bg-gradient-to-b from-brand-950/80 to-brand-900/40 p-5 backdrop-blur-sm",
        glowSuccess:
          "border border-success-foreground/20 bg-surface-elevated p-5 shadow-[0_4px_24px_-4px_rgba(34,197,94,0.25)]",
        glowError:
          "border border-error-foreground/20 bg-surface-elevated p-5 shadow-[0_4px_24px_-4px_rgba(239,68,68,0.25)]",
        storage:
          "border border-brand-700/30 bg-surface-elevated p-4 shadow-[0_0_20px_-4px_rgba(89,37,220,0.4)]",
        ghost: "bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function Surface({
  className,
  variant,
  children,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof surfaceVariants>) {
  if (variant === "glass") {
    return (
      <LiquidGlass
        className={cn("w-full", className)}
        contentClassName="text-secondary-foreground text-sm font-semibold"
        {...props}
      >
        {children}
      </LiquidGlass>
    )
  }

  return (
    <div className={cn(surfaceVariants({ variant, className }))} {...props}>
      {children}
    </div>
  )
}

/** Purple glow divider used under balance rows in glass cards */
export function SurfaceGlowDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none h-3 w-full opacity-60",
        "bg-gradient-to-r from-transparent via-brand-700/40 to-transparent blur-sm",
        className
      )}
    />
  )
}

export { surfaceVariants }
