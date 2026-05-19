"use client"

import { ComponentProps, ReactNode, useMemo } from "react"
import Link from "next/link"
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
  useResolveSuiNSName,
} from "@mysten/dapp-kit"
import type { WalletAccount } from "@mysten/wallet-standard"
import { blo } from "blo"
import { ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react"
import { toast } from "sonner"

import { images } from "@/config/image"
import { links } from "@/config/link"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useBalances } from "@/hooks/use-balances"
import { usePrices } from "@/hooks/use-prices"

import { Button } from "./ui/button"
import { GlassPill } from "./ui/glass-pill"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Skeleton } from "./ui/skeleton"
import { Surface, SurfaceGlowDivider } from "./ui/surface"

export function WalletButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  const currentAccount = useCurrentAccount()

  return !currentAccount ? (
    <ConnectModal
      trigger={
        <Button
          variant="outline"
          className={cn("rounded-full", className)}
          onClick={() => track("ClickWalletConnect", undefined)}
          {...props}
        >
          Connect Wallet
        </Button>
      }
    />
  ) : (
    <ConnectWalletButton
      currentAccount={currentAccount}
      className={className}
      {...props}
    />
  )
}

/** Figma header wallet — 40px avatar when connected, skeuomorphic Connect when not */
export function NavbarWalletButton({ className }: { className?: string }) {
  const currentAccount = useCurrentAccount()

  if (!currentAccount) {
    return (
      <ConnectModal
        trigger={
          <GlassPill
            type="button"
            className={cn("hidden md:inline-flex", className)}
            contentClassName="font-semibold text-secondary-foreground"
            onClick={() => track("ClickWalletConnect", undefined)}
          >
            Connect Wallet
          </GlassPill>
        }
      />
    )
  }

  return (
    <WalletAccountMenu
      currentAccount={currentAccount}
      trigger={
        <button
          type="button"
          aria-label="Wallet menu"
          className={cn(
            "size-10 shrink-0 overflow-hidden rounded-full border border-black/[0.08]",
            "shadow-[var(--shadow-elevated)] transition-[transform,filter] duration-150",
            "hover:brightness-110 active:scale-[0.97]",
            className
          )}
        >
          <img
            src={blo(currentAccount.address as `0x${string}`)}
            alt="Wallet"
            className="size-full object-cover"
          />
        </button>
      }
    />
  )
}

export function MobileWalletCard() {
  const currentAccount = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const { walBalance, suiBalance } = useBalances()
  const prices = usePrices()

  const totalBalanceUsd = useMemo(() => {
    if (!prices.data || walBalance === null || suiBalance === null) return null
    return walBalance
      .times(prices.data.wal.price)
      .plus(suiBalance.times(prices.data.sui.price))
  }, [prices.data, walBalance, suiBalance])

  if (!currentAccount) return null

  const truncatedAddress = `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`

  return (
    <Surface variant="glass" id="mobile-wallet-card">
      <div className="flex items-center gap-1 px-3 pb-1 pt-2">
        <div className="size-6 shrink-0 overflow-hidden rounded-full border border-black/10">
          <img
            src={blo(currentAccount.address as `0x${string}`)}
            alt="wallet"
            className="size-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <span className="text-tertiary truncate font-mono text-xs">
            {truncatedAddress}
          </span>
          <Button
            variant="ghost"
            size="iconXs"
            className="size-7 shrink-0 rounded-md text-tertiary hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(currentAccount.address)
              toast.success("Copied to clipboard")
              track("CopyToClipboard", { contentType: "walletAddress" })
            }}
          >
            <Copy className="size-4" />
          </Button>
          <Link
            href={links.account(currentAccount.address)}
            target="_blank"
            onClick={() =>
              track("ExternalLinkClick", {
                url: links.account(currentAccount.address),
                label: "SuiScan Wallet",
              })
            }
          >
            <Button
              variant="ghost"
              size="iconXs"
              className="size-7 shrink-0 rounded-md text-tertiary hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-secondary-foreground">
            Total Balance
          </span>
          {totalBalanceUsd !== null ? (
            <span className="font-heading text-xl font-bold text-foreground">
              ${formatter.number(totalBalanceUsd, 0)}
            </span>
          ) : (
            <Skeleton className="h-6 w-24" />
          )}
        </div>
        <SurfaceGlowDivider className="absolute inset-x-0 bottom-0" />
      </div>

      <div className="px-3 py-2">
        <Button
          variant="skeuomorphic"
          className="h-10 w-full rounded-full text-sm font-semibold"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    </Surface>
  )
}

/** @deprecated use MobileWalletCard on mobile */
export function WalletCard() {
  const currentAccount = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const { data: name } = useResolveSuiNSName(currentAccount?.address ?? "")
  const { walBalance, suiBalance } = useBalances()

  if (!currentAccount) {
    return (
      <div className="border-border-secondary bg-surface-elevated space-y-3 rounded-2xl border p-4">
        <div className="text-secondary-foreground text-sm">
          Connect your wallet to view balances and manage staking.
        </div>
        <ConnectModal
          trigger={
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => track("ClickWalletConnect", undefined)}
            >
              Connect Wallet
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="border-border-secondary bg-surface-elevated space-y-3 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <img
          src={blo(currentAccount.address as `0x${string}`)}
          alt="wallet"
          className="size-10 shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          {name && <div className="truncate font-mono text-sm">{name}</div>}
          <div className="text-tertiary truncate font-mono text-xs">
            {`${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`}
          </div>
        </div>
        <Link
          href={links.account(currentAccount.address)}
          target="_blank"
          onClick={() =>
            track("ExternalLinkClick", {
              url: links.account(currentAccount.address),
              label: "SuiScan Wallet",
            })
          }
        >
          <Button variant="ghost" size="iconXs">
            <ExternalLink className="size-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="iconXs"
          onClick={() => {
            navigator.clipboard.writeText(currentAccount.address)
            toast.success("Copied to clipboard")
            track("CopyToClipboard", { contentType: "walletAddress" })
          }}
        >
          <Copy className="size-4" />
        </Button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-tertiary">WAL</span>
          <span className="font-semibold">
            {walBalance ? `${formatter.number(walBalance)} WAL` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-tertiary">SUI</span>
          <span className="font-semibold">
            {suiBalance ? `${formatter.number(suiBalance)} SUI` : "—"}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full rounded-full"
        onClick={() => disconnect()}
      >
        <LogOut className="size-4" />
        Disconnect
      </Button>
    </div>
  )
}

function ConnectWalletButton({
  currentAccount,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  currentAccount: WalletAccount
}) {
  return (
    <WalletAccountMenu
      currentAccount={currentAccount}
      trigger={
        <Button variant="skeuomorphic" className={cn("rounded-full", className)} {...props}>
          <WalletTriggerLabel address={currentAccount.address} />
        </Button>
      }
    />
  )
}

function WalletTriggerLabel({ address }: { address: string }) {
  const { data: name } = useResolveSuiNSName(address)

  return (
    <>
      <img
        src={blo(address as `0x${string}`)}
        alt="wallet"
        className="-ml-2 size-6 shrink-0 rounded-full"
      />
      <span className="truncate font-mono">
        {name || `${address.slice(0, 6)}...${address.slice(-4)}`}
      </span>
      <ChevronDown />
    </>
  )
}

function WalletAccountMenu({
  currentAccount,
  trigger,
}: {
  currentAccount: WalletAccount
  trigger: ReactNode
}) {
  const { data: name } = useResolveSuiNSName(currentAccount.address)
  const { mutate: disconnect } = useDisconnectWallet()
  const { walBalance, suiBalance } = useBalances()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]" align="end" variant="glass">
        <DropdownMenuItem>
          <img
            src={blo(currentAccount.address as `0x${string}`)}
            alt="logo"
            className="size-10 shrink-0 rounded-full"
          />
          <div className="min-w-0 text-foreground">
            {name && <div className="truncate font-mono text-sm">{name}</div>}
            <div className="text-tertiary truncate font-mono text-xs">
              {`${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`}
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuLabel>Tokens</DropdownMenuLabel>
        <DropdownMenuItem>
          <img src={images.sui} alt="sui" className="size-6" />
          {suiBalance ? (
            <span className="ml-auto font-semibold">
              {formatter.number(suiBalance)} SUI
            </span>
          ) : (
            <Skeleton className="ml-auto h-6 w-16" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <img src={images.wal} alt="wal" className="size-6" />
          {walBalance ? (
            <span className="ml-auto font-semibold">
              {formatter.number(walBalance)} WAL
            </span>
          ) : (
            <Skeleton className="ml-auto h-6 w-16" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <Link
          href={links.account(currentAccount.address)}
          target="_blank"
          onClick={() =>
            track("ExternalLinkClick", {
              url: links.account(currentAccount.address),
              label: "SuiScan Wallet",
            })
          }
        >
          <DropdownMenuItem>
            <ExternalLink />
            View on SuiScan
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          onSelect={() => {
            navigator.clipboard.writeText(currentAccount.address)
            toast.success("Copied to clipboard")
            track("CopyToClipboard", { contentType: "walletAddress" })
          }}
        >
          <Copy />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => disconnect()}>
          <LogOut />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
