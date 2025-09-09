import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full
  text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50
  [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0
  [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50
  focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
  aria-invalid:border-destructive cursor-pointer`,
  {
    variants: {
      variant: {
        default: "bg-accent text-foreground shadow-xs hover:bg-accent/80",
        outline: `border shadow-xs bg-primary text-secondary-foreground hover:bg-primary/90 hover:text-accent-foreground/75`,
        active: `bg-accent-purple text-primary-foreground shadow-xs hover:bg-accent-purple/90`,
        inactive: `bg-transparent text-secondary-foreground hover:bg-accent-purple/10`,
        purple: `bg-accent-purple-dark text-foreground shadow-xs hover:bg-accent-purple-dark/90`,
        purpleSecondary: `bg-transparent text-accent-purple hover:bg-accent-purple/10 shadow-xs`,
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        error: "bg-error text-foreground shadow-xs hover:bg-error/90",
        errorSecondary:
          "bg-transparent text-error-foreground shadow-xs hover:bg-error-foreground/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 gap-1.5 px-3.5",
        xs: "h-7 gap-1 px-2.5 text-xs",
        lg: "h-11 px-6",
        icon: "size-9",
        iconSm: "size-6",
        iconXs: "size-5 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
