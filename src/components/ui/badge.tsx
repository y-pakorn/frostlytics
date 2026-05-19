import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
  transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground bg-background",
        accentPurple:
          "border-transparent bg-accent-purple text-primary hover:bg-accent-purple/80",
        accentPurpleOutline:
          "border-accent-purple bg-accent-purple-dark/20 text-accent-purple hover:bg-accent-purple-dark/10",
        success:
          "border-success-foreground bg-success text-success-foreground hover:bg-success/80",
        walPrice:
          "border-border-secondary bg-surface-elevated gap-1.5 px-2.5 py-1 text-sm font-bold text-foreground",
        epoch:
          "border-transparent bg-brand-700/30 text-brand-300 px-2 py-0.5 text-xs font-bold",
        deltaUp:
          "border-transparent bg-success/20 text-success-foreground text-xs font-semibold",
        deltaDown:
          "border-transparent bg-error/20 text-error-foreground text-xs font-semibold",
      },
      size: {
        md: "text-xs pb-0 leading-4.5",
        sm: "text-[10px] py-0 px-1 leading-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
