"use client"

import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit"
import { blo } from "blo"
import { X } from "lucide-react"

import { track } from "@/lib/analytic"

import { SearchPopover } from "./search-popover"
import { Button } from "./ui/button"
import { GlassPill } from "./ui/glass-pill"

export function MobileSidebarHeader({ onClose }: { onClose: () => void }) {
  const currentAccount = useCurrentAccount()

  return (
    <div className="flex h-12 shrink-0 items-center justify-between px-4">
      <Button
        variant="ghost"
        size="iconSm"
        className="rounded-full text-white"
        onClick={onClose}
        aria-label="Close menu"
      >
        <X className="size-5" />
      </Button>

      <div className="flex items-center gap-2">
        <SearchPopover variant="mobilePill" onNavigate={onClose} />

        {currentAccount ? (
          <div className="size-9 shrink-0 overflow-hidden rounded-full border border-black/10 shadow-[var(--shadow-elevated)]">
            <img
              src={blo(currentAccount.address as `0x${string}`)}
              alt="Wallet"
              className="size-full object-cover"
            />
          </div>
        ) : (
          <ConnectModal
            trigger={
              <GlassPill
                type="button"
                className="h-9 px-3"
                contentClassName="font-semibold text-secondary-foreground"
                onClick={() => track("ClickWalletConnect", undefined)}
              >
                Connect Wallet
              </GlassPill>
            }
          />
        )}
      </div>
    </div>
  )
}
