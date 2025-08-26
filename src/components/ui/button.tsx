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
  aria-invalid:border-destructive`,
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-primary-foreground shadow-xs hover:bg-foreground/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: `border shadow-xs bg-primary text-secondary-foreground hover:bg-primary/90 hover:text-accent-foreground/75`,
        active: `bg-accent-purple text-primary-foreground shadow-xs hover:bg-accent-purple/90`,
        inactive: `bg-transparent text-secondary-foreground hover:bg-accent-purple/10`,
        purple: `bg-accent-purple-dark text-foreground shadow-xs hover:bg-accent-purple-dark/90`,
        purpleSecondary: `bg-transparent text-accent-purple hover:bg-accent-purple/10 shadow-xs`,
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 gap-1.5 px-3.5",
        lg: "h-10 px-6",
        icon: "size-9",
        iconSm: "size-6",
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
