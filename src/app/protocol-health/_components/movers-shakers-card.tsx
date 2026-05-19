"use client"

import { useMemo } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import keyBy from "lodash/keyBy"

import { useFullOperators } from "@/hooks"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"

import { MetricCard } from "@/components/ui/metric-card"
import type { ProtocolHealthMovers } from "@/hooks/use-protocol-health"

const POS_COLOR = "var(--color-success-foreground)"
const NEG_COLOR = "var(--color-error-foreground)"

const shortId = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`

export function MoversShakersCard({
  movers,
  loading,
}: {
  movers: ProtocolHealthMovers | undefined
  loading?: boolean
}) {
  const fullOperators = useFullOperators()
  const operatorsById = useMemo(
    () => keyBy(fullOperators ?? [], "id"),
    [fullOperators]
  )
  const nameFor = (id: string) => operatorsById[id]?.name ?? shortId(id)

  const gainers = movers?.gainers ?? []
  const losers = movers?.losers ?? []

  return (
    <MetricCard
      className="h-full"
      title="Movers & Shakers"
      description="Top-3 operators by weight-share change over the last ~30 epochs. Surfaces concentration shifts in the active set."
      legend={[
        { label: "Gain", color: POS_COLOR },
        { label: "Loss", color: NEG_COLOR },
      ]}
      value={
        movers && (gainers.length > 0 || losers.length > 0) ? (
          <span className="text-base font-semibold">
            {gainers.length + losers.length} operators tracked
          </span>
        ) : null
      }
      loading={loading}
    >
      <div className="grid h-full grid-cols-2 gap-2 text-xs">
        <div className="space-y-1.5">
          <div className="text-success-foreground inline-flex items-center gap-1 font-semibold">
            <TrendingUp className="size-3" /> Gainers
          </div>
          {gainers.length === 0 ? (
            <div className="text-tertiary">—</div>
          ) : (
            gainers.map((g) => (
              <Row
                key={`g-${g.operatorId}`}
                name={nameFor(g.operatorId)}
                currentPct={g.currentWeightPct}
                change={g.weightPctChange}
                positive
              />
            ))
          )}
        </div>
        <div className="space-y-1.5">
          <div className="text-error-foreground inline-flex items-center gap-1 font-semibold">
            <TrendingDown className="size-3" /> Losers
          </div>
          {losers.length === 0 ? (
            <div className="text-tertiary">—</div>
          ) : (
            losers.map((l) => (
              <Row
                key={`l-${l.operatorId}`}
                name={nameFor(l.operatorId)}
                currentPct={l.currentWeightPct}
                change={l.weightPctChange}
              />
            ))
          )}
        </div>
      </div>
    </MetricCard>
  )
}

function Row({
  name,
  currentPct,
  change,
  positive,
}: {
  name: string
  currentPct: number
  change: number
  positive?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="text-foreground truncate font-medium">{name}</div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-tertiary">
          {formatter.percentage(currentPct, { mantissa: 2 })}
        </span>
        <span
          className={cn(
            "font-mono font-semibold",
            positive ? "text-success-foreground" : "text-error-foreground"
          )}
        >
          {formatter.percentage(change, { mantissa: 2, forceSign: true })}
        </span>
      </div>
    </div>
  )
}
