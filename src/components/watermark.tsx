import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

import { Icons } from "./icons"

export function Watermark({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 opacity-25",
        className
      )}
      {...props}
    >
      <Icons.logo className="size-1/4" /> <Icons.logoText className="w-1/3" />
    </div>
  )
}
