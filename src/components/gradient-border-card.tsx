import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function GradientBorderCard({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, hsla(237, 37%, 6%, 0.2) 0%, hsla(254, 36%, 24%, 0.2) 100%)",
        boxShadow: "0px 0px 0px 1px hsla(190, 33%, 8%, 1)",
        border: "1px solid hsla(0, 0%, 17%, 0)",
      }}
      className={cn(
        "text-secondary-foreground min-w-0 rounded-2xl px-4 py-3 text-sm font-semibold backdrop-blur-xs",
        className
      )}
    >
      {children}
    </div>
  )
}
