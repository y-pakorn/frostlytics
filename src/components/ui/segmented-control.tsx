"use client"

import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "pill",
  className,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  variant?: "pill" | "figma"
  className?: string
}) {
  if (variant === "figma") {
    return (
      <div
        className={cn(
          "border-border-primary inline-flex overflow-hidden rounded-xl border",
          "shadow-[var(--shadow-xs)] isolate",
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
                "relative px-2 py-0.5 text-xs font-semibold transition-colors",
                index < options.length - 1 && "border-border-primary border-r",
                isActive
                  ? "text-secondary-foreground bg-white/[0.08]"
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
