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
          "linear-gradient(129.43deg, #644B9B 16.64%, rgba(43, 43, 43, 0) 72.56%)",
      }}
      className={cn("rounded-2xl p-[1px]", className)}
    >
      <div className="bg-background/85 rounded-2xl">
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(10, 11, 23, 0.4) 0%, rgba(50, 40, 84, 0.4) 100%);",
          }}
          className="text-secondary-foreground rounded-2xl px-4 py-3 text-sm font-semibold"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
