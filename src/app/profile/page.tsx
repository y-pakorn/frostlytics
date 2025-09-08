"use client"

import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

import { Profile } from "./profile"

export default function ProfilePage() {
  const account = useCurrentAccount()

  if (!account) {
    return <WalletNotConnected />
  }

  return <Profile address={account.address} />
}

function WalletNotConnected() {
  return (
    <div className="text-secondary-foreground flex h-full flex-col items-center justify-center gap-4 text-center">
      <Icons.wallet className="text-accent-purple-dark size-11" />
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Wallet Not Connected</h1>
        <p className="text-muted-foreground max-w-sm text-sm font-medium">
          Please connect your wallet to view your profile. We need access to
          your wallet address to load your assets and activity.
        </p>
      </div>
      <ConnectModal
        trigger={<Button variant="purple">Connect Wallet</Button>}
      />
    </div>
  )
}
