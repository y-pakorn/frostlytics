"use client"

import Link from "next/link"
import { useCurrentAccount } from "@mysten/dapp-kit"

import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useBalances } from "@/hooks/use-balances"
import { useStakedWal } from "@/hooks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { GlassCard } from "@/components/ui/glass-card"

function PositionRow({
  label,
  value,
  loading,
}: {
  label: string
  value: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="flex min-w-0 items-start gap-0.5">
      <span className="text-tertiary shrink-0 text-sm leading-5 font-normal">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-right">
        {loading ? (
          <Skeleton className="ml-auto h-[22px] w-8" />
        ) : (
          <span className="font-heading text-foreground block truncate text-lg leading-normal font-bold">
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

export function YourPositionCard() {
  const account = useCurrentAccount()
  const { walBalance } = useBalances()
  const stakedWal = useStakedWal({ address: account?.address })
  const totalPositions = stakedWal.data?.length ?? 0

  return (
    <GlassCard
      tone="chart"
      className={cn(
        "h-[197px] w-full shrink-0",
        "md:w-[228px] md:min-w-[228px] md:max-w-[228px]"
      )}
      contentClassName="h-full"
      innerClassName="h-full justify-between"
    >
      <p className="font-heading text-foreground shrink-0 truncate text-center text-base leading-6 font-semibold">
        Your Position
      </p>

      <div className="flex min-w-0 flex-col gap-1">
        <PositionRow
          label="$WAL"
          value={
            account && walBalance
              ? formatter.numberReadable(walBalance.toNumber())
              : "-"
          }
        />
        <PositionRow
          label="Total Position"
          value={
            !account
              ? 0
              : stakedWal.isLoading
                ? null
                : totalPositions
          }
          loading={!!account && stakedWal.isLoading}
        />
      </div>

      <Button
        variant="purple"
        size="default"
        className="h-auto w-full shrink-0 rounded-full border-2 border-white/[0.12] px-3 py-2 text-sm leading-5 font-semibold [box-shadow:var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)]"
        asChild
      >
        <Link href="/staking-operators">Stake</Link>
      </Button>
    </GlassCard>
  )
}
