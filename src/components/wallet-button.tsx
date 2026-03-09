"use client"

import { ComponentProps } from "react"
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

import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Skeleton } from "./ui/skeleton"

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
          className="rounded-full"
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

function ConnectWalletButton({
  currentAccount,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  currentAccount: WalletAccount
}) {
  const { data: name } = useResolveSuiNSName(currentAccount.address)
  const { mutate: disconnect } = useDisconnectWallet()

  const { walBalance, suiBalance } = useBalances()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full" {...props}>
          <img
            src={blo(currentAccount.address as any)}
            alt="wallet"
            className="-ml-2 size-6 shrink-0 rounded-full"
          />
          <span className="truncate font-mono">
            {name ||
              `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`}
          </span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]">
        <DropdownMenuItem>
          <img
            src={blo(currentAccount.address as any)}
            alt="logo"
            className="size-10 shrink-0 rounded-full"
          />
          <div>
            {name && <div className="truncate font-mono">{name}</div>}
            <div
              className={cn(
                "truncate font-mono",
                name && "text-secondary-foreground"
              )}
            >
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
