"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { LiquidGlass } from "./liquid-glass"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const popoverContentVariants = cva(
  cn(
    "text-popover-foreground data-[state=open]:animate-in",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
    "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
    "data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin] outline-none"
  ),
  {
    variants: {
      variant: {
        default:
          "z-50 bg-popover border-popover-border w-72 rounded-md border p-4 shadow-md",
        glass:
          "z-[200] w-auto border-0 bg-transparent p-0 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    VariantProps<typeof popoverContentVariants>
>(({ className, align = "center", sideOffset = 4, variant, children, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    {variant === "glass" ? (
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(popoverContentVariants({ variant, className }))}
        {...props}
        asChild
      >
        <LiquidGlass
          radius={16}
          opaque
          overlay
          contentClassName="overflow-hidden text-foreground"
          className="w-[min(420px,calc(100vw-2rem))]"
        >
          {children}
        </LiquidGlass>
      </PopoverPrimitive.Content>
    ) : (
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(popoverContentVariants({ variant, className }))}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    )}
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
