import { Copy } from "lucide-react"
import { toast } from "sonner"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { images } from "@/config/image"
import { formatter } from "@/lib/formatter"
import { Surface } from "@/components/ui/surface"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function OperatorRewardRowCard({
  operator,
  reward,
}: {
  operator: OperatorWithSharesAndBaseApy
  reward?: number
}) {
  const metadata = operator.metadata
  return (
    <Surface className="space-y-2 p-4">
      <div className="flex items-center gap-3">
        {metadata?.imageUrl ? (
          <img
            src={metadata.imageUrl}
            alt={operator.name}
            className="size-10 shrink-0 rounded-full"
            onError={(e) => (e.currentTarget.src = images.avatar)}
          />
        ) : (
          <Icons.avatar className="size-10 shrink-0 rounded-full" />
        )}
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
              onClick={() => {
                navigator.clipboard.writeText(operator.id)
                toast.success("Copied to clipboard")
              }}
            >
              <Copy />
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/5 pt-2 text-xs">
        <div>
          <div className="text-tertiary">APY</div>
          <div className="text-accent-blue font-bold">
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
          <div className="text-foreground text-base font-bold">
            {reward ? `${formatter.number(reward, 4)} WAL` : "—"}
          </div>
        </div>
      </div>
    </Surface>
  )
}
