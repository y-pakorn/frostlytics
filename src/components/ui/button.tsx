import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** Figma Buttons/Button — bg-primary surface + border-primary + skeuomorphic depth */
const figmaSurfaceButton =
  "relative border border-border-primary bg-surface-primary text-secondary-foreground hover:brightness-110 active:scale-[0.98] [box-shadow:var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)] active:[box-shadow:var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner),inset_0_2px_4px_rgba(0,0,0,0.2)]"

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full
  text-sm font-semibold cursor-pointer
  transition-[transform,background-color,box-shadow,color,opacity,filter] duration-150 ease-out
  active:scale-[0.97] active:duration-75
  motion-reduce:transition-none motion-reduce:active:scale-100
  disabled:pointer-events-none disabled:opacity-50
  [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0
  [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50`,
  {
    variants: {
      variant: {
        /** Brand purple CTA — utility-brand-300 */
        default:
          "bg-primary text-primary-foreground shadow-xs hover:brightness-110 active:brightness-95",
        /** Figma secondary button (Connect Wallet, Disconnect, chips) */
        outline: figmaSurfaceButton,
        secondary: figmaSurfaceButton,
        ghost:
          "hover:bg-white/[0.08] active:bg-white/[0.12] hover:text-foreground",
        link: "text-accent-teal underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:scale-[0.97]",
        success:
          "bg-success-foreground/15 text-success-foreground border border-success-foreground/30 hover:brightness-110 active:brightness-95",
        purple:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:brightness-110 active:brightness-95",
        purpleSecondary:
          "bg-transparent text-brand-400 border border-brand-700/50 hover:bg-brand-950/50 active:brightness-95",
        active: "bg-primary text-primary-foreground",
        inactive:
          "bg-transparent text-secondary-foreground hover:bg-nav-active active:brightness-95",
        error: "bg-error text-error-foreground hover:bg-error/90 active:scale-[0.97]",
        errorSecondary:
          "bg-transparent text-error-foreground border border-error-foreground/30 hover:bg-error/20 active:brightness-95",
        outlineTransparent:
          "border border-border-secondary bg-transparent text-secondary-foreground hover:bg-surface-elevated/60 active:scale-[0.98]",
        skeuomorphic: figmaSurfaceButton,
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
