import Link from "next/link"
import { ChevronRight, Copy } from "lucide-react"
import { toast } from "sonner"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { formatter } from "@/lib/formatter"
import { SafeImage } from "@/components/safe-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"

export function OperatorRewardRowCard({
  operator,
  reward,
}: {
  operator: OperatorWithSharesAndBaseApy
  reward?: number
}) {
  return (
    <GlassCard tone="chart" contentClassName="p-4" innerClassName="gap-3">
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
          <div className="text-tertiary flex items-center gap-1 font-mono text-xs">
            {operator.id.slice(0, 8)}…{operator.id.slice(-6)}
            <Button
              size="iconXs"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault()
                navigator.clipboard.writeText(operator.id)
                toast.success("Copied to clipboard")
              }}
            >
              <Copy />
            </Button>
          </div>
        </div>
        <ChevronRight className="text-tertiary size-4 shrink-0" />
      </Link>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <div className="text-tertiary">APY</div>
          <div className="text-success-foreground font-medium">
            {formatter.percentage(operator.apyWithCommission)}
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
        <div className="col-span-2 border-t border-white/5 pt-2">
          <div className="text-tertiary">Estimated Reward</div>
          <div className="text-brand-300 text-base font-semibold">
            {reward ? `${formatter.number(reward, 4)} WAL` : "—"}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
