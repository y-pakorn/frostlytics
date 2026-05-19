"use client"

import { images } from "@/config/image"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { usePrices } from "@/hooks/use-prices"

import { Skeleton } from "./ui/skeleton"

/** Inline WAL price for sidebar header — Figma: coin + price only */
export function SidebarWalPrice({ className }: { className?: string }) {
  const prices = usePrices()

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <img
        src={images.wal}
        alt="WAL"
        className="size-[18px] shrink-0 rounded-full"
      />
      {prices.data ? (
        <span className="text-xs leading-4 font-bold text-white">
          ${formatter.number(prices.data.wal.price)}
        </span>
      ) : (
        <Skeleton className="h-3.5 w-10" />
      )}
    </div>
  )
}

/** @deprecated use SidebarWalPrice */
export const WalPriceBadge = SidebarWalPrice
