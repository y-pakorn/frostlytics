"use client"

import { lazy, Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { images } from "@/config/image"
import { links } from "@/config/link"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GradientBorderCard } from "@/components/gradient-border-card"
import { SafeImage } from "@/components/safe-image"
import { StakeDialog } from "@/components/stake-dialog"
import { useOperatorMetadatas, useOperatorWithSharesAndBaseApy } from "@/hooks"

const OperatorDelegators = lazy(() =>
  import("./delegators").then((m) => ({ default: m.OperatorDelegators }))
)
const OperatorDelegations = lazy(() =>
  import("./delegations").then((m) => ({ default: m.OperatorDelegations }))
)
const OperatorTransactions = lazy(() =>
  import("./transactions").then((m) => ({ default: m.OperatorTransactions }))
)

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
  id,
  defaultTab,
}: {
  id: string
  defaultTab?: string
}) {
  const operatorMetadatas = useOperatorMetadatas()
  const operatorMetadata = operatorMetadatas.data?.[id]

  const operator = useOperatorWithSharesAndBaseApy({
    id,
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
        <SafeImage
          src={operatorMetadata?.imageUrl}
          alt={operator?.name ?? id}
          className="size-16 shrink-0 rounded-full"
        />
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-bold">
            {operator?.name ?? (
              <Skeleton className="inline-block h-7 w-40" />
            )}
          </h1>
          <div className="flex items-center gap-1">
            <p className="font-mono font-medium">
              {id.slice(0, 8)}...
              {id.slice(-8)}
            </p>
            <Button
              variant="ghost"
              size="iconXs"
              onClick={() => {
                navigator.clipboard.writeText(id)
                toast.success("Copied to clipboard")
                track("CopyToClipboard", { contentType: "operatorId" })
              }}
            >
              <Copy />
            </Button>
            <Link
              href={links.object(id)}
              target="_blank"
              onClick={() =>
                track("ExternalLinkClick", {
                  url: links.object(id),
                  label: "SuiScan Operator",
                })
              }
            >
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
                        track("CopyToClipboard", {
                          contentType:
                            label === "Commission receiver"
                              ? "commissionReceiver"
                              : "governanceAuthorized",
                        })
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
                        track("ExternalLinkClick", {
                          url: links.account(value),
                          label: `SuiScan ${label}`,
                        })
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
                  track("TabChange", { tabName: t.label, operatorId: id })
                  window.history.replaceState(
                    null,
                    "",
                    `/operator?id=${id}&tab=${t.label}`
                  )
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <TabComponent operator={{ id, name: operator?.name ?? "", imageUrl: operatorMetadata?.imageUrl ?? "", description: operatorMetadata?.description ?? "", projectUrl: operatorMetadata?.projectUrl ?? "" }} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
