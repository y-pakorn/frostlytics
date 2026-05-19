"use client"

import { formatter } from "@/lib/formatter"
import { Skeleton } from "@/components/ui/skeleton"
import { useSystem } from "@/hooks"

import { HomeGlassCard } from "./home-glass-card"

export function StorageCostSection() {
  const system = useSystem()

  const items = [
    {
      label: "Shards",
      value: system ? formatter.number(system.nShards) : null,
      desc: "Individual Data Partitions",
    },
    {
      label: "Storage Price",
      value: system ? formatter.number(system.storagePrice) : null,
      desc: "Frost / MiB / Epoch",
    },
    {
      label: "Write Price",
      value: system ? formatter.number(system.writePrice) : null,
      desc: "Frost / MiB",
    },
  ]

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 lg:h-full lg:w-[419px]">
      <h2 className="font-heading text-foreground text-2xl font-bold">
        Storage Cost
      </h2>
      <div className="flex min-h-[120px] flex-1 flex-col gap-1 sm:flex-row sm:items-stretch lg:min-h-0">
        {items.map((item) => (
          <HomeGlassCard
            key={item.label}
            tone="storage"
            className="h-full min-w-0 flex-1"
            innerClassName="h-full justify-between"
            contentClassName="px-4 py-3"
          >
            <p className="text-brand-300 text-sm font-bold">{item.label}</p>
            {item.value ? (
              <p className="text-foreground text-2xl leading-8 font-semibold">
                {item.value}
              </p>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
            <p className="text-secondary-foreground text-sm font-bold">
              {item.desc}
            </p>
          </HomeGlassCard>
        ))}
      </div>
    </div>
  )
}
