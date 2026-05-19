import Link from "next/link"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"
import { Surface } from "@/components/ui/surface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DelegationResponse } from "@/types"

export function DelegationRowCard({
  row,
}: {
  row: DelegationResponse["delegations"][number]
}) {
  const [address, amount, activationEpoch, age, operation, digest, name] = row
  return (
    <Surface className="space-y-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/profile?addr=${address}`}
          prefetch={false}
          className="min-w-0 flex-1"
        >
          {name ? (
            <div className="text-foreground truncate font-medium">{name}</div>
          ) : null}
          <div className="text-tertiary flex items-center gap-1 font-mono text-xs">
            {address.slice(0, 8)}…{address.slice(-8)}
            <Button
              variant="ghost"
              size="iconXs"
              onClick={(e) => {
                e.preventDefault()
                navigator.clipboard.writeText(address)
                toast.success("Copied to clipboard")
              }}
            >
              <Copy />
            </Button>
          </div>
        </Link>
        <Badge
          variant={
            operation === "Staked"
              ? "success"
              : operation === "Withdrawing"
                ? "accentPurpleOutline"
                : "outline"
          }
          className="shrink-0"
        >
          {operation}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1 border-t border-white/5 pt-2 text-xs">
        <div>
          <div className="text-tertiary">Amount</div>
          <div className="text-foreground font-medium">
            {formatter.number(amount)} WAL
          </div>
        </div>
        <div>
          <div className="text-tertiary">Epoch</div>
          <div className="text-foreground font-medium">{activationEpoch}</div>
        </div>
        <div>
          <div className="text-tertiary">Age</div>
          <div className="text-foreground font-medium">
            {dayjs(age).fromNow(true)}
          </div>
        </div>
      </div>
      <Link
        href={links.transaction(digest)}
        target="_blank"
        className="text-tertiary inline-flex items-center gap-1 text-xs hover:underline"
      >
        View transaction <ExternalLink className="size-3" />
      </Link>
    </Surface>
  )
}
