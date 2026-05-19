"use client"

import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"

import { Profile } from "./profile"

export function MyProfile() {
  const account = useCurrentAccount()

  if (!account) {
    return <WalletNotConnected />
  }

  return <Profile address={account.address} />
}

function WalletNotConnected() {
  return (
    <GlassCard
      tone="chart"
      className="rounded-3xl"
      contentClassName="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <Icons.wallet className="text-accent-purple-dark size-11" />
      <div className="space-y-1">
        <h1 className="font-heading text-foreground text-xl font-bold">
          Wallet Not Connected
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm font-medium">
          Please connect your wallet to view your profile. We need access to
          your wallet address to load your assets and activity.
        </p>
      </div>
      <ConnectModal
        trigger={<Button variant="skeuomorphic">Connect Wallet</Button>}
      />
    </GlassCard>
  )
}
