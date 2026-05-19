import { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

export function GlassInput({
  className,
  containerClassName,
  icon,
  ...props
}: ComponentProps<"input"> & {
  containerClassName?: string
  icon?: ReactNode
}) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-full items-center overflow-hidden rounded-full",
        "drop-shadow-[0px_4px_4px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.2)]",
        "[box-shadow:var(--shadow-xs)]",
        containerClassName
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-search-surface"
      />
      {icon ? (
        <span className="text-foreground/70 relative z-10 shrink-0 pl-3">
          {icon}
        </span>
      ) : null}
      <input
        data-slot="glass-input"
        className={cn(
          "relative z-10 h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none",
          "placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-50",
          icon ? "px-2" : "px-3",
          className
        )}
        {...props}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[var(--shadow-skeu-highlight)]"
      />
    </div>
  )
}
