import { ComponentProps } from "react"

import { images } from "@/config/image"
import { cn } from "@/lib/utils"

export const Icons = {
  logo: ({ className, ...props }: ComponentProps<"img">) => (
    <img
      {...props}
      src={images.logo}
      className={cn("size-10 shrink-0", className)}
    />
  ),
  logoText: ({ className, ...props }: ComponentProps<"img">) => (
    <img
      {...props}
      src={images.logoText}
      className={cn("h-10 shrink-0", className)}
    />
  ),
}
