import Link from "next/link"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { formatter } from "@/lib/formatter"
import { Surface } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import type { DelegatorResponse } from "@/types"

export function DelegatorRowCard({
  row,
}: {
  row: DelegatorResponse["delegators"][number]
}) {
  const [address, amount, activationEpoch, name] = row
  return (
    <Surface className="space-y-2 p-4">
      <Link
        href={`/profile?addr=${address}`}
        prefetch={false}
        className="block"
      >
        {name ? (
          <div className="text-foreground font-medium">{name}</div>
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
          <Button
            variant="ghost"
            size="iconXs"
            onClick={(e) => {
              e.preventDefault()
              window.open(links.account(address), "_blank")
            }}
          >
            <ExternalLink />
          </Button>
        </div>
      </Link>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/5 pt-2 text-xs">
        <div>
          <div className="text-tertiary">Amount</div>
          <div className="text-foreground font-medium">
            {formatter.number(amount)} WAL
          </div>
        </div>
        <div>
          <div className="text-tertiary">Activation Epoch</div>
          <div className="text-foreground font-medium">{activationEpoch}</div>
        </div>
      </div>
    </Surface>
  )
}
