import Link from "next/link"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { walrus } from "@/config/walrus"
import { Surface } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import type { OperatorTransaction } from "@/types"

export function TransactionRowCard({ tx }: { tx: OperatorTransaction }) {
  const gasSui = tx.gas / walrus.denominator
  return (
    <Surface className="space-y-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-foreground font-medium">
            {tx.txLabel ? "Programmable Tx" : "Unknown"}
          </div>
          {tx.txLabel ? (
            <div className="text-tertiary truncate font-mono text-xs">
              {tx.txLabel}
            </div>
          ) : null}
        </div>
        <Link href={links.transaction(tx.digest)} target="_blank">
          <Button variant="ghost" size="iconXs" className="text-tertiary">
            <ExternalLink />
          </Button>
        </Link>
      </div>

      <Link
        href={`/profile?addr=${tx.sender}`}
        prefetch={false}
        className="block border-t border-white/5 pt-2"
      >
        {tx.name ? (
          <div className="text-foreground truncate text-xs font-medium">
            {tx.name}
          </div>
        ) : null}
        <div className="text-tertiary flex items-center gap-1 font-mono text-xs">
          {tx.sender.slice(0, 8)}…{tx.sender.slice(-8)}
          <Button
            variant="ghost"
            size="iconXs"
            onClick={(e) => {
              e.preventDefault()
              navigator.clipboard.writeText(tx.sender)
              toast.success("Copied to clipboard")
            }}
          >
            <Copy />
          </Button>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/5 pt-2 text-xs">
        <div>
          <div className="text-tertiary">Txs</div>
          <div className="text-foreground font-medium">{tx.txCount}</div>
        </div>
        <div>
          <div className="text-tertiary">Gas</div>
          <div className="text-foreground font-medium">{gasSui} SUI</div>
        </div>
      </div>
    </Surface>
  )
}
