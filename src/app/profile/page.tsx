"use client"

import { useState } from "react"
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
  Search,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GradientBorderCard } from "@/components/gradient-border-card"
import { Icons } from "@/components/icons"

const validators = [
  {
    name: "Mysten Labs 0",
    id: "0xf11fef95c8c5a17c2cbc51c15483e38585cf996110b8d50b8e1957442dc736fd",
    totalStaked: "25,515,385.3516",
    votingWeight: "0.45",
    apy: "0.67",
    commission: "80",
  },
]

const staked = {
  "0xf11fef95c8c5a17c2cbc51c15483e38585cf996110b8d50b8e1957442dc736fd": {
    amount: "42",
    value: "115",
  },
} as Record<string, { amount: string; value: string }>

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
  const [shown, setShown] = useState(false)

  return (
    <div className="space-y-6">
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
      <div className="flex items-center gap-2">
        <div className="bg-accent-purple-light text-primary flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold">
          Staking
          <div className="bg-accent-purple-deep! text-foreground flex size-5.5 items-center justify-center rounded-full text-center text-xs tracking-tight">
            <div className="mt-0.5">{shown ? 2 : 0}</div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="relative md:w-[330px]">
          <Input placeholder="Enter Operator Name" className="pl-10" />
          <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        </div>
      </div>
      {shown ? (
        <Table className="flex-1">
          <TableHeader>
            <TableRow>
              <TableHead>Name/ID</TableHead>
              <TableHead>APY</TableHead>
              <TableHead>Voting Weight</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead className="rounded-tr-3xl">Total Staked</TableHead>
              <TableHead className="text-foreground rounded-tl-3xl text-end">
                Your Staking
              </TableHead>
              <TableHead className="text-foreground text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validators.map((validator) => {
              const s = staked[validator.id]
              return (
                <TableRow key={validator.id}>
                  <TableCell>
                    <div className="font-medium">{validator.name}</div>
                    <div className="text-tertiary font-mono text-sm">
                      {validator.id.slice(0, 8)}...{validator.id.slice(-8)}
                    </div>
                  </TableCell>
                  <TableCell className="text-accent-blue font-bold">
                    {validator.apy}%
                  </TableCell>
                  <TableCell className="text-secondary">
                    {validator.votingWeight}
                    <span className="text-tertiary">%</span>
                  </TableCell>
                  <TableCell className="text-secondary">
                    {validator.commission}
                    <span className="text-tertiary">%</span>
                  </TableCell>
                  <TableCell className="text-secondary">
                    {validator.totalStaked} WAL
                  </TableCell>
                  <TableCell className="text-end">
                    {s ? (
                      <>
                        <div className="font-bold">{s.amount} WAL</div>
                        <div className="text-tertiary font-semibold">
                          ${s.value}
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="purpleSecondary" size="sm">
                      Unstake
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-disabled flex h-[320px] flex-col items-center justify-center space-y-2.5 text-center font-medium">
          <div>
            No staked validators yet.
            <br />
            Get started by finding a Operator to stake with
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              Find Operators <ArrowUpRight />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
