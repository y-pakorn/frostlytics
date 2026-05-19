"use client"

import { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

import { LiquidGlass } from "./liquid-glass"

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "pill",
  activeTone = "default",
  size = "sm",
  fill = false,
  className,
}: {
  options: { label: ReactNode; value: T }[]
  value: T
  onChange: (value: T) => void
  variant?: "pill" | "figma" | "glass"
  activeTone?: "default" | "purple"
  size?: "sm" | "md"
  /** Equal-width tabs that grow to fill the container width */
  fill?: boolean
  className?: string
}) {
  if (variant === "glass") {
    return (
      <LiquidGlass
        radius={size === "md" ? 20 : 12}
        className={cn(
          "inline-flex h-10 w-fit max-w-full min-w-0",
          fill && "w-full",
          className
        )}
        contentClassName="flex h-full min-w-0 items-center p-1"
      >
        <div
          className={cn(
            "flex h-full min-w-0 items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            fill ? "w-full overflow-x-visible" : "w-max max-w-full"
          )}
        >
          <div
            role="tablist"
            className={cn(
              "flex h-full items-center gap-0.5",
              fill ? "w-full" : "w-max"
            )}
          >
            {options.map((option) => {
              const isActive = value === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(option.value)}
                  className={cn(
                    "relative flex h-8 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors",
                    fill ? "min-w-0 flex-1" : "shrink-0",
                    size === "md" ? "px-3 text-sm" : "px-2.5 text-xs",
                    isActive
                      ? activeTone === "purple"
                        ? "bg-brand-400 text-foreground shadow-[var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)]"
                        : "text-foreground bg-white/[0.12] shadow-[var(--shadow-xs)]"
                      : "text-tertiary hover:text-secondary-foreground"
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </LiquidGlass>
    )
  }

  if (variant === "figma") {
    return (
      <div
        className={cn(
          "border-border-primary inline-flex overflow-hidden rounded-xl border",
          "shadow-[var(--shadow-xs)] isolate",
          size === "md" && "h-10 items-stretch",
          className
        )}
        role="tablist"
      >
        {options.map((option, index) => {
          const isActive = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative font-semibold transition-colors",
                size === "md"
                  ? "flex h-full items-center px-3 text-sm"
                  : "px-2 py-0.5 text-xs",
                index < options.length - 1 && "border-border-primary border-r",
                isActive
                  ? activeTone === "purple"
                    ? "bg-brand-400 text-foreground"
                    : "text-secondary-foreground bg-white/[0.08]"
                  : "text-tertiary bg-black/20 hover:text-secondary-foreground"
              )}
            >
              {option.label}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 shadow-[var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)]"
              />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-surface-elevated border-border-secondary inline-flex items-center gap-0.5 rounded-full border p-0.5",
        className
      )}
      role="tablist"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-secondary-foreground/15 text-foreground"
              : "text-muted-foreground hover:text-secondary-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SegmentedControlItem({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        className
      )}
      {...props}
    />
  )
}
