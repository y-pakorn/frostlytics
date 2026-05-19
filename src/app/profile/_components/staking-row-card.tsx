import Link from "next/link"
import { Copy, ExternalLink } from "lucide-react"
import startCase from "lodash/startCase"
import { toast } from "sonner"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { links } from "@/config/link"
import { formatter } from "@/lib/formatter"
import { track } from "@/lib/analytic"
import { Surface } from "@/components/ui/surface"
import { SafeImage } from "@/components/safe-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UnstakeDialog } from "@/components/unstake-dialog"
import { WithdrawDialog } from "@/components/withdraw-dialog"
import type { StakedWalWithStatus } from "@/types"

export function StakingRowCard({
  stakedWal,
  operator,
  estimatedReward,
  readOnly,
}: {
  stakedWal: StakedWalWithStatus
  operator: OperatorWithSharesAndBaseApy | undefined
  estimatedReward: number
  readOnly?: boolean
}) {
  return (
    <Surface className="space-y-3 p-4">
      {/* Operator row */}
      {operator ? (
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
            <div className="text-foreground truncate font-medium">
              {operator.name}
            </div>
            <div className="text-tertiary font-mono text-xs">
              {operator.id.slice(0, 8)}…{operator.id.slice(-6)}
            </div>
          </div>
        </Link>
      ) : (
        <Skeleton className="h-10 w-full" />
      )}

      {/* Position ID + status */}
      <div className="space-y-1 border-t border-white/5 pt-2">
        <div className="text-tertiary text-xs">Position</div>
        <div className="flex items-center gap-1">
          <div className="text-tertiary font-mono text-xs font-medium">
            {stakedWal.id.slice(0, 8)}…{stakedWal.id.slice(-6)}
          </div>
          <Button
            variant="ghost"
            size="iconXs"
            onClick={() => {
              navigator.clipboard.writeText(stakedWal.id)
              toast.success("Copied to clipboard")
              track("CopyToClipboard", { contentType: "positionId" })
            }}
          >
            <Copy />
          </Button>
          <Link href={links.object(stakedWal.id)} target="_blank">
            <Button variant="ghost" size="iconXs">
              <ExternalLink />
            </Button>
          </Link>
        </div>
        <Badge
          variant={
            stakedWal.status === "staked"
              ? "success"
              : stakedWal.status === "claimable"
                ? "accentPurpleOutline"
                : "outline"
          }
        >
          {startCase(stakedWal.status)}
        </Badge>
      </div>

      {/* Amount + epoch */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/5 pt-2 text-xs">
        <div>
          <div className="text-tertiary">Amount</div>
          <div className="text-foreground font-bold">
            {formatter.number(stakedWal.amount)} WAL
          </div>
        </div>
        <div>
          <div className="text-tertiary">Activation Epoch</div>
          <div className="text-foreground font-medium">
            Epoch {stakedWal.activationEpoch}
          </div>
        </div>
      </div>

      {/* Action */}
      {!readOnly ? (
        stakedWal.status === "withdrawing" ? (
          <div className="text-disabled text-xs font-semibold">
            Withdrawing Epoch {stakedWal.withdrawEpoch}
          </div>
        ) : stakedWal.canWithdrawRightNow ? (
          <WithdrawDialog
            stakedWal={[stakedWal]}
            estimatedReward={estimatedReward}
          >
            <Button variant="errorSecondary" size="sm" className="w-full">
              Withdraw
            </Button>
          </WithdrawDialog>
        ) : (
          <UnstakeDialog
            stakedWal={stakedWal}
            operator={operator || null}
            estimatedReward={estimatedReward}
          >
            <Button variant="purpleSecondary" size="sm" className="w-full">
              Unstake
            </Button>
          </UnstakeDialog>
        )
      ) : null}
    </Surface>
  )
}
