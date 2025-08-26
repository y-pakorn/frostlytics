"use client"

import Link from "next/link"
import {
  ConnectModal,
  useCurrentAccount,
  useResolveSuiNSName,
} from "@mysten/dapp-kit"
import { WalletAccount } from "@mysten/wallet-standard"
import { blo } from "blo"
import {
  ArrowUpRight,
  Copy,
  Diamond,
  Gem,
  PackageCheck,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { GradientBorderCard } from "@/components/gradient-border-card"
import { Icons } from "@/components/icons"

export default function ProfilePage() {
  const account = useCurrentAccount()

  if (!account) {
    return <WalletNotConnected />
  }

  return <WalletConnected account={account} />
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

function WalletConnected({ account }: { account: WalletAccount }) {
  const { data: name } = useResolveSuiNSName(account.address)

  return (
    <div>
      <GradientBorderCard>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img
              src={blo(account.address as any)}
              className="size-12 shrink-0 rounded-full"
            />
            <div className="break-all">
              <h1 className="text-foreground line-clamp-1 text-2xl font-medium">
                {name ||
                  `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
              </h1>
              <p className="line-clamp-1 font-mono text-sm">
                {account.address}
              </p>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(account.address)
                toast.success("Address copied to clipboard")
              }}
            >
              Copy Address <Copy />
            </Button>
            <Link href={links.account(account.address)} target="_blank">
              <Button variant="outline" size="sm">
                View on SuiScan <ArrowUpRight />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: Wallet,
                label: "WAL Balance",
                value: "345.24",
              },
              {
                icon: PackageCheck,
                label: "Staked WAL",
                value: "116",
              },
              {
                icon: Gem,
                label: "Estimated Reward",
                value: "12.5",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex w-full gap-3 rounded-lg bg-black/20 p-4 shadow-xs"
              >
                <div
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon",
                    className: "rounded-md",
                  })}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <h3>{label}</h3>
                  <p className="text-foreground text-xl font-medium">
                    {value} WAL
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GradientBorderCard>
    </div>
  )
}
