"use client"

import { ComponentProps } from "react"
import Link from "next/link"
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
  useResolveSuiNSName,
  useSuiClientQueries,
} from "@mysten/dapp-kit"
import type { WalletAccount } from "@mysten/wallet-standard"
import BigNumber from "bignumber.js"
import { blo } from "blo"
import { ChevronDown, ExternalLink, LogOut } from "lucide-react"

import { images } from "@/config/image"
import { links } from "@/config/link"
import { walrus } from "@/config/walrus"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"

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
        <Button variant="outline" className="rounded-full" {...props}>
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

  const [walBalance, suiBalance] = useSuiClientQueries({
    queries: [
      {
        method: "getBalance",
        params: {
          owner: currentAccount.address,
          coinType: walrus.walToken,
        },
        options: {
          select: (data) =>
            new BigNumber(data.totalBalance).div(walrus.denominator),
        },
      },
      {
        method: "getBalance",
        params: {
          owner: currentAccount.address,
          coinType: walrus.suiToken,
        },
        options: {
          select: (data) =>
            new BigNumber(data.totalBalance).div(walrus.denominator),
        },
      },
    ],
  })

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
        <Link href={links.account(currentAccount.address)} target="_blank">
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
            <ExternalLink className="ml-auto" />
          </DropdownMenuItem>
        </Link>
        <DropdownMenuLabel>Tokens</DropdownMenuLabel>
        <DropdownMenuItem>
          <img src={images.sui} alt="sui" className="size-6" />
          {suiBalance?.data ? (
            <span className="ml-auto font-semibold">
              {formatter.number(suiBalance.data)} SUI
            </span>
          ) : (
            <Skeleton className="ml-auto h-6 w-16" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <img src={images.wal} alt="wal" className="size-6" />
          {walBalance?.data ? (
            <span className="ml-auto font-semibold">
              {formatter.number(walBalance.data)} WAL
            </span>
          ) : (
            <Skeleton className="ml-auto h-6 w-16" />
          )}
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
