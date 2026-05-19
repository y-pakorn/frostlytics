import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const glassPillVariants = cva(
  cn(
    "relative inline-flex items-center justify-center overflow-hidden text-left",
    "drop-shadow-[0px_4px_4px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.2)]",
    "[box-shadow:var(--shadow-xs)]",
    "transition-[transform,filter] duration-150 ease-out",
    "hover:brightness-110 active:scale-[0.98] active:duration-75",
    "motion-reduce:transition-none motion-reduce:active:scale-100",
    "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
  ),
  {
    variants: {
      size: {
        pill: "h-10 rounded-full px-3 text-sm font-normal",
        icon: "size-9 rounded-full p-0",
      },
    },
    defaultVariants: {
      size: "pill",
    },
  }
)

export function GlassPill({
  className,
  contentClassName,
  size,
  asChild = false,
  children,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof glassPillVariants> & {
    asChild?: boolean
    contentClassName?: string
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(glassPillVariants({ size, className }))}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-search-surface"
      />
      <span
        className={cn(
          "relative flex w-full items-center gap-2",
          size === "icon" && "justify-center",
          contentClassName
        )}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[var(--shadow-skeu-highlight)]"
      />
    </Comp>
  )
}
