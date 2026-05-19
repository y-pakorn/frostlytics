import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-placeholder",
        "selection:text-primary-foreground bg-surface-primary flex h-10 w-full",
        "min-w-0 rounded-xl border border-border-secondary px-3 py-1 shadow-xs",
        "transition-[color,box-shadow] outline-none file:inline-flex file:h-7",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "text-sm text-foreground",
        "focus-visible:border-brand-700 focus-visible:ring-brand-700/30 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "selection:bg-foreground/90",
        className
      )}
      {...props}
    />
  )
}

export { Input }
