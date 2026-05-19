import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { formatter } from "@/lib/formatter"
import { Surface } from "@/components/ui/surface"
import { SafeImage } from "@/components/safe-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StakeDialog } from "@/components/stake-dialog"

export function OperatorRowCard({
  operator,
  yourStake,
  yourPositions,
}: {
  operator: OperatorWithSharesAndBaseApy
  yourStake?: number
  yourPositions?: number
}) {
  return (
    <Surface className="space-y-3 p-4">
      <Link
        href={`/operator?id=${operator.id}`}
        prefetch={false}
        className="flex items-center gap-3"
      >
        <SafeImage
          src={operator.metadata?.imageUrl}
          alt={operator.name}
          className="size-10 shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="text-foreground truncate font-medium">
              {operator.name}
            </div>
            {!operator.isCommittee && (
              <Badge variant="outline" size="sm" className="shrink-0">
                Not Committee
              </Badge>
            )}
          </div>
          <div className="text-tertiary font-mono text-xs">
            {operator.id.slice(0, 8)}…{operator.id.slice(-6)}
          </div>
        </div>
        <ChevronRight className="text-tertiary size-4 shrink-0" />
      </Link>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <div className="text-tertiary">APY</div>
          <div className="text-accent-blue font-bold">
            {formatter.percentage(operator.apyWithCommission)}
          </div>
        </div>
        <div>
          <div className="text-tertiary">Voting Weight</div>
          <div className="text-foreground font-medium">
            {formatter.percentage(operator.pct, { percent: false })}
            <span className="text-tertiary">%</span>
          </div>
        </div>
        <div>
          <div className="text-tertiary">Commission</div>
          <div className="text-foreground font-medium">
            {formatter.percentage(operator.commissionRate, { percent: false })}
            <span className="text-tertiary">%</span>
          </div>
        </div>
        <div>
          <div className="text-tertiary">Total Staked</div>
          <div className="text-foreground font-medium">
            {operator.staked
              ? `${formatter.numberReadable(operator.staked)} WAL`
              : "—"}
          </div>
        </div>
        {yourStake != null && yourStake > 0 ? (
          <div className="col-span-2 border-t border-white/5 pt-2">
            <div className="text-tertiary">Your Stake</div>
            <div className="flex items-baseline gap-2">
              <span className="text-foreground font-bold">
                {formatter.number(yourStake)} WAL
              </span>
              {yourPositions != null ? (
                <span className="text-tertiary text-[11px]">
                  {yourPositions} positions
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <StakeDialog operator={operator}>
        <Button variant="purpleSecondary" size="sm" className="w-full">
          Stake
        </Button>
      </StakeDialog>
    </Surface>
  )
}
