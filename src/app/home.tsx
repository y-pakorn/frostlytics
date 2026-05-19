"use client"

import { HistoricalData } from "@/types"

import { DailySummarySection } from "./_components/protocol-stats/daily-summary"
import { HeroMetricsRow } from "./_components/protocol-stats/hero-metrics-row"
import { NetworkActivitySection } from "./_components/protocol-stats/network-activity"
import { StorageCostSection } from "./_components/protocol-stats/storage-cost"
import { useHomeMetrics } from "./_components/protocol-stats/use-home-metrics"

export default function Home({
  historicalData,
}: {
  historicalData: HistoricalData[]
}) {
  const { averageApy } = useHomeMetrics()

  return (
    <div className="flex flex-col gap-8">
      <HeroMetricsRow averageApy={averageApy} historicalData={historicalData} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 lg:h-[172px] lg:flex-row lg:gap-6">
          <div className="min-w-0 flex-1">
            <DailySummarySection historicalData={historicalData} />
          </div>
          <StorageCostSection />
        </div>

        <NetworkActivitySection historicalData={historicalData} />
      </div>
    </div>
  )
}
