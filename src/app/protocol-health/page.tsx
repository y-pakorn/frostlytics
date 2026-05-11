"use client"

import { useMemo, useState } from "react"

import { useProtocolHealth } from "@/hooks/use-protocol-health"
import { formatter } from "@/lib/formatter"

import { ActiveStakeRatioCard } from "./_components/active-stake-ratio-card"
import { CentralizationRiskCard } from "./_components/centralization-risk-card"
import { HeroKpi } from "./_components/hero-kpi"
import { MoversShakersCard } from "./_components/movers-shakers-card"
import { NetPoolFlowCard } from "./_components/net-pool-flow-card"
import { NetworkCapacityCard } from "./_components/network-capacity-card"
import { NodeParticipationCard } from "./_components/node-participation-card"
import { OperatorChurnCard } from "./_components/operator-churn-card"
import { OperatorProfitabilityCard } from "./_components/operator-profitability-card"
import { PriceVolatilityCard } from "./_components/price-volatility-card"
import { ProtocolRevenueCard } from "./_components/protocol-revenue-card"
import { RevenueCompositionCard } from "./_components/revenue-composition-card"
import { SectionHeading } from "./_components/section-heading"
import { StakeDistributionEqualityCard } from "./_components/stake-distribution-equality-card"
import { StakeStorageCorrelationCard } from "./_components/stake-storage-correlation-card"
import { StakingBarrierCard } from "./_components/staking-barrier-card"
import { deltaOver } from "./_components/stats"
import { SubsidyRelianceCard } from "./_components/subsidy-reliance-card"
import {
  TimerangePicker,
  type Timerange,
} from "./_components/timerange-picker"
import { TVLCard } from "./_components/tvl-card"
import { WhaleDominanceCard } from "./_components/whale-dominance-card"

const nakamotoLabel = (n: number) =>
  n <= 3 ? "high risk" : n <= 6 ? "moderate" : "well distributed"

export default function ProtocolHealthPage() {
  const { data, isLoading } = useProtocolHealth()
  const [range, setRange] = useState<Timerange>("90d")

  const daily = data?.daily ?? []
  const revenue = data?.revenue ?? []
  const decentralization = data?.decentralization ?? []
  const churn = data?.churn ?? []
  const movers = data?.movers

  const hero = useMemo(() => {
    const latestDaily = daily[daily.length - 1]
    const latestDecent = decentralization[decentralization.length - 1]
    const activeDelta30 = deltaOver(
      daily.map((d) => d.activeCount),
      30
    )
    const tvlDelta30 = deltaOver(
      daily.map((d) => d.totalStakedWAL),
      30
    )
    const nakDelta30 = deltaOver(
      decentralization.map((d) => d.nakamoto33),
      30
    )
    const last30Epochs = churn.slice(-30)
    const netChange30 = last30Epochs.reduce(
      (a, c) => a + c.joined - c.exited,
      0
    )
    // Cumulative lifetime revenue
    const cumulativeRevenue: number[] = []
    let runningTotal = 0
    for (const r of revenue) {
      runningTotal += r.grossInflowWAL ?? 0
      cumulativeRevenue.push(runningTotal)
    }
    return {
      latestDaily,
      latestDecent,
      activeDelta30,
      tvlDelta30,
      nakDelta30,
      netChange30,
      lifetimeRevenue: runningTotal,
      revenueEpochsTracked: revenue.length,
      sparklineActive: daily.slice(-30).map((d) => d.activeCount),
      sparklineTVL: daily.slice(-30).map((d) => d.totalStakedWAL),
      sparklineNak: decentralization.slice(-30).map((d) => d.nakamoto33),
      sparklineChurn: last30Epochs.map((c) => c.joined - c.exited),
      sparklineRevenue: cumulativeRevenue.slice(-30),
    }
  }, [daily, decentralization, churn, revenue])

  return (
    <div className="space-y-8">
      {/* Page title + timerange picker */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">
            Protocol Health
          </h1>
          <p className="text-secondary-foreground mt-1 text-sm">
            Network-wide health across participation, economics, tokenomics, and
            decentralization.
          </p>
        </div>
        <TimerangePicker value={range} onChange={setRange} />
      </div>

      {/* Hero KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <HeroKpi
          label="Active Operators"
          value={
            hero.latestDaily
              ? formatter.number(hero.latestDaily.activeCount ?? 0, 0)
              : "—"
          }
          delta={
            hero.activeDelta30 != null
              ? { value: hero.activeDelta30 }
              : null
          }
          context={
            hero.latestDaily
              ? `${formatter.number(hero.latestDaily.committeeCount ?? 0, 0)} on committee`
              : null
          }
          sparkline={hero.sparklineActive}
          trendColor="var(--color-accent-blue)"
          loading={isLoading}
        />
        <HeroKpi
          label="Total Value Locked"
          value={
            hero.latestDaily
              ? `${formatter.numberReadable(hero.latestDaily.totalStakedWAL ?? 0, 2)} WAL`
              : "—"
          }
          delta={
            hero.tvlDelta30 != null ? { value: hero.tvlDelta30 } : null
          }
          context="staked across the network"
          sparkline={hero.sparklineTVL}
          trendColor="var(--color-success-foreground)"
          loading={isLoading}
        />
        <HeroKpi
          label="Nakamoto Coefficient"
          value={
            hero.latestDecent
              ? `N = ${formatter.number(hero.latestDecent.nakamoto33, 0)}`
              : "—"
          }
          delta={
            hero.nakDelta30 != null ? { value: hero.nakDelta30 } : null
          }
          context={
            hero.latestDecent
              ? nakamotoLabel(hero.latestDecent.nakamoto33)
              : null
          }
          sparkline={hero.sparklineNak}
          trendColor="var(--color-accent-purple)"
          loading={isLoading}
        />
        <HeroKpi
          label="Operator Net Change"
          value={
            <span
              className={
                hero.netChange30 >= 0
                  ? "text-success-foreground"
                  : "text-error-foreground"
              }
            >
              {hero.netChange30 >= 0 ? "+" : ""}
              {formatter.number(hero.netChange30, 0)}
            </span>
          }
          context="over last 30 epochs"
          sparkline={hero.sparklineChurn}
          trendColor={
            hero.netChange30 >= 0
              ? "var(--color-success-foreground)"
              : "var(--color-error-foreground)"
          }
          loading={isLoading}
        />
        <HeroKpi
          label="Total Protocol Revenue"
          value={
            hero.revenueEpochsTracked > 0
              ? `${formatter.numberReadable(hero.lifetimeRevenue, 2)} WAL`
              : "—"
          }
          context={
            hero.revenueEpochsTracked > 0
              ? `since launch · ${formatter.number(hero.revenueEpochsTracked, 0)} epochs`
              : null
          }
          sparkline={hero.sparklineRevenue}
          trendColor="var(--color-accent-purple-light)"
          loading={isLoading}
        />
      </div>

      {/* Section 1: 2 cards (wider for emphasis) */}
      <section className="space-y-3">
        <SectionHeading
          title="Network Health & Growth"
          description="Key metrics tracking the network's operational status and expansion."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NodeParticipationCard daily={daily} range={range} loading={isLoading} />
          <NetworkCapacityCard daily={daily} range={range} loading={isLoading} />
        </div>
      </section>

      {/* Section 2: 4 cards */}
      <section className="space-y-3">
        <SectionHeading
          title="Economic & Revenue"
          description="Financial signals on usage demand, cost stability, and operator incentives."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ProtocolRevenueCard daily={daily} range={range} loading={isLoading} />
          <PriceVolatilityCard daily={daily} range={range} loading={isLoading} />
          <OperatorProfitabilityCard
            daily={daily}
            revenue={revenue}
            range={range}
            loading={isLoading}
          />
          <SubsidyRelianceCard revenue={revenue} range={range} loading={isLoading} />
          <RevenueCompositionCard revenue={revenue} range={range} loading={isLoading} />
          <NetPoolFlowCard revenue={revenue} range={range} loading={isLoading} />
        </div>
      </section>

      {/* Section 3: 4 cards */}
      <section className="space-y-3">
        <SectionHeading
          title="Tokenomics & Staking"
          description="Stake distribution, barrier to entry, and security alignment."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TVLCard daily={daily} range={range} loading={isLoading} />
          <StakingBarrierCard daily={daily} range={range} loading={isLoading} />
          <ActiveStakeRatioCard
            daily={daily}
            decentralization={decentralization}
            range={range}
            loading={isLoading}
          />
          <StakeStorageCorrelationCard />
        </div>
      </section>

      {/* Section 4: 4 cards */}
      <section className="space-y-3">
        <SectionHeading
          title="Decentralization & Security"
          description="Concentration risk, whale dominance, and operator-set stability."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CentralizationRiskCard
            decentralization={decentralization}
            range={range}
            loading={isLoading}
          />
          <WhaleDominanceCard
            decentralization={decentralization}
            range={range}
            loading={isLoading}
          />
          <StakeDistributionEqualityCard
            decentralization={decentralization}
            range={range}
            loading={isLoading}
          />
          <OperatorChurnCard churn={churn} range={range} loading={isLoading} />
          <MoversShakersCard movers={movers} loading={isLoading} />
        </div>
      </section>
    </div>
  )
}
