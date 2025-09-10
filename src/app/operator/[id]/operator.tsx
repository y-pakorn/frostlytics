"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { MinimalOperatorWithMetadata } from "@/types/operator"
import { images } from "@/config/image"
import { links } from "@/config/link"
import { formatter } from "@/lib/formatter"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GradientBorderCard } from "@/components/gradient-border-card"
import { StakeDialog } from "@/components/stake-dialog"
import {
  useDelegations,
  useDelegators,
  useOperatorTransactions,
  useOperatorWithSharesAndBaseApy,
} from "@/hooks"

import { OperatorDelegations } from "./delegations"
import { OperatorDelegators } from "./delegators"
import { OperatorTransactions } from "./transactions"

const tabs = [
  {
    label: "Delegators",
    component: OperatorDelegators,
  },
  {
    label: "Delegations",
    component: OperatorDelegations,
  },
  {
    label: "Transactions",
    component: OperatorTransactions,
  },
] as const

export function Operator({
  operator: operatorMetadata,
  searchParams,
}: {
  operator: MinimalOperatorWithMetadata
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: defaultTab } = use(searchParams)

  const operator = useOperatorWithSharesAndBaseApy({
    id: operatorMetadata.id,
  })

  const [tab, setTab] = useState<(typeof tabs)[number]["label"]>(
    tabs.find((t) => t.label === defaultTab)?.label || tabs[0].label
  )
  const TabComponent = useMemo(() => {
    return tabs.find((t) => t.label === tab)!.component
  }, [tab])

  return (
    <div className="space-y-4">
      <GradientBorderCard className="flex items-center gap-4">
        <img
          src={operatorMetadata.imageUrl}
          alt={operatorMetadata.name}
          className="size-16 shrink-0 rounded-full"
          onError={(e) => (e.currentTarget.src = images.avatar)}
        />
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-bold">
            {operatorMetadata.name}
          </h1>
          <div className="flex items-center gap-1">
            <p className="font-mono font-medium">
              {operatorMetadata.id.slice(0, 8)}...
              {operatorMetadata.id.slice(-8)}
            </p>
            <Button
              variant="ghost"
              size="iconXs"
              onClick={() => {
                navigator.clipboard.writeText(operatorMetadata.id)
                toast.success("Copied to clipboard")
              }}
            >
              <Copy />
            </Button>
            <Link href={links.object(operatorMetadata.id)} target="_blank">
              <Button variant="ghost" size="iconXs">
                <ExternalLink />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {operator ? (
              <StakeDialog operator={operator}>
                <Button variant="purple" size="sm" className="w-[120px]">
                  Stake
                </Button>
              </StakeDialog>
            ) : (
              <Button variant="purple" size="sm" className="w-[120px]" disabled>
                Stake
              </Button>
            )}
            <Link href="/profile">
              <Button variant="outline" size="sm" className="w-[120px]">
                Manage
              </Button>
            </Link>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4 rounded-2xl bg-black/20 p-4">
          {[
            {
              label: "Total Staked",
              value: operator
                ? `${formatter.numberReadable(operator.staked)} WAL`
                : null,
              isLoading: !operator,
            },
            {
              label: "Reward Pool",
              value: operator
                ? `${formatter.numberReadable(operator.rewardsPool)} WAL`
                : null,
              isLoading: !operator,
            },
            {
              label: "Commission",
              value: operator
                ? formatter.percentage(operator.commissionRate)
                : null,
              isLoading: !operator,
            },
            {
              label: "Pool Share",
              value: operator ? `${formatter.number(operator.pct)} WAL` : null,
              isLoading: !operator,
            },
          ].map(({ label, value, isLoading }, i) => (
            <div key={i} className="space-y-1">
              <div>{label}</div>
              {isLoading ? (
                <Skeleton className="h-7 w-18" />
              ) : (
                <div className="text-foreground text-lg font-medium">
                  {value}
                </div>
              )}
            </div>
          ))}
        </div>
      </GradientBorderCard>
      <div className="flex gap-6">
        <div className="w-[330px] shrink-0 space-y-2 text-sm font-medium">
          <h2 className="font-bold">Info</h2>
          <div className="space-y-2 rounded-2xl bg-black/20 p-4">
            {[
              {
                label: "Pending Stake",
                value: operator
                  ? `${formatter.numberReadable(operator.pendingStake)} WAL`
                  : null,
                isLoading: !operator,
              },
              {
                label: "Pending Shares Withdraw",
                value: operator
                  ? `${formatter.numberReadable(operator.pendingSharesWithdraw)} WAL`
                  : null,
                isLoading: !operator,
              },
              {
                label: "Pre Active Withdrawals",
                value: operator
                  ? `${formatter.numberReadable(operator.preActiveWithdrawals)} WAL`
                  : null,
                isLoading: !operator,
              },
              {
                label: "Activation Epoch",
                value: operator ? `${operator.activationEpoch}` : null,
                isLoading: !operator,
              },
              {
                label: "Latest Epoch",
                value: operator ? `${operator.latestEpoch}` : null,
                isLoading: !operator,
              },
            ].map(({ label, value, isLoading }, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="text-tertiary font-semibold">{label}</div>
                {isLoading ? (
                  <Skeleton className="h-5 w-18" />
                ) : (
                  <div>{value}</div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-2xl bg-black/20 p-4">
            {[
              {
                label: "Commission receiver",
                value: operator?.commissionReceiver || "",
                isLoading: !operator,
              },
              {
                label: "Governace authorized",
                value: operator?.governaceAuthorized || "",
                isLoading: !operator,
              },
            ].map(({ label, value, isLoading }, i) => (
              <div key={i} className="space-y-1">
                <div className="text-tertiary font-semibold">{label}</div>
                {isLoading ? (
                  <Skeleton className="h-5 w-18" />
                ) : (
                  <div className="flex min-w-0 items-center gap-1 truncate font-mono">
                    {value.slice(0, 10)}...{value.slice(-8)}{" "}
                    <Button
                      variant="ghost"
                      size="iconXs"
                      className="text-tertiary"
                      onClick={() => {
                        navigator.clipboard.writeText(value)
                        toast.success("Copied to clipboard")
                      }}
                    >
                      <Copy />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconXs"
                      className="text-tertiary"
                      onClick={() => {
                        window.open(links.account(value), "_blank")
                      }}
                    >
                      <ExternalLink />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h2 className="font-bold">Voting Params</h2>
          <div className="space-y-2 rounded-2xl bg-black/20 p-4">
            {[
              {
                label: "Node Capacity",
                value: operator
                  ? `${formatter.number(operator.capacityTB)} TB`
                  : null,
                isLoading: !operator,
              },
              {
                label: "Storage Price",
                value: operator
                  ? `${formatter.number(operator.storagePrice)} FROST`
                  : null,
                isLoading: !operator,
              },
              {
                label: "Write Price",
                value: operator
                  ? `${formatter.number(operator.writePrice)} FROST`
                  : null,
                isLoading: !operator,
              },
              {
                label: "Number of Shards",
                value: operator ? `${operator.weight}` : null,
                isLoading: !operator,
              },
            ].map(({ label, value, isLoading }, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="text-tertiary font-semibold">{label}</div>
                {isLoading ? (
                  <Skeleton className="h-5 w-18" />
                ) : (
                  <div>{value}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            {tabs.map((t) => (
              <Button
                key={t.label}
                variant={t.label === tab ? "active" : "inactive"}
                onClick={() => {
                  setTab(t.label)
                  window.history.replaceState(
                    null,
                    "",
                    `/operator/${operatorMetadata.id}?tab=${t.label}`
                  )
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <TabComponent operator={operatorMetadata} />
        </div>
      </div>
    </div>
  )
}
