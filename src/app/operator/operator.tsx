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
import { Surface } from "@/components/ui/surface"
import { SafeImage } from "@/components/safe-image"
import { StakeDialog } from "@/components/stake-dialog"
import { useOperatorMetadatas, useOperatorWithSharesAndBaseApy } from "@/hooks"
import { useOperatorHistory } from "@/hooks/use-operator-history"

import { OperatorHistorySection } from "./_components/operator-history-section"

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

  const { data: historyMeta } = useOperatorHistory(id)

  const [tab, setTab] = useState<(typeof tabs)[number]["label"]>(
    tabs.find((t) => t.label === defaultTab)?.label || tabs[0].label
  )
  const TabComponent = useMemo(() => {
    return tabs.find((t) => t.label === tab)!.component
  }, [tab])

  return (
    <div className="space-y-4">
      <Surface className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <SafeImage
            src={operatorMetadata?.imageUrl}
            alt={operator?.name ?? id}
            className="size-16 shrink-0 rounded-full"
          />
          <div className="min-w-0 space-y-1">
            <h1 className="text-foreground text-xl font-bold sm:text-2xl">
              {operator?.name ?? (
                <Skeleton className="inline-block h-7 w-40" />
              )}
            </h1>
            {historyMeta?.firstEpoch != null && historyMeta?.tenureEpochs ? (
              <div className="text-tertiary text-xs font-medium">
                Active since Ep {historyMeta.firstEpoch} ·{" "}
                {formatter.number(historyMeta.tenureEpochs, 0)} epochs
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-1">
              <p className="font-mono text-sm font-medium sm:text-base">
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
            <div className="flex flex-wrap items-center gap-2">
              {operator ? (
                <StakeDialog operator={operator}>
                  <Button variant="purple" size="sm" className="flex-1 sm:w-[120px] sm:flex-initial">
                    Stake
                  </Button>
                </StakeDialog>
              ) : (
                <Button variant="purple" size="sm" className="flex-1 sm:w-[120px] sm:flex-initial" disabled>
                  Stake
                </Button>
              )}
              <Link href="/profile" className="flex-1 sm:flex-initial">
                <Button variant="outline" size="sm" className="w-full sm:w-[120px]">
                  Manage
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-black/20 p-4 sm:ml-auto sm:flex sm:items-center sm:gap-4">
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
              <div className="text-xs sm:text-sm">{label}</div>
              {isLoading ? (
                <Skeleton className="h-7 w-18" />
              ) : (
                <div className="text-foreground text-base font-medium sm:text-lg">
                  {value}
                </div>
              )}
            </div>
          ))}
        </div>
      </Surface>

      <OperatorHistorySection operatorId={id} />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 space-y-2 text-sm font-medium lg:w-[330px]">
          <h2 className="font-heading font-bold">Info</h2>
          <div className="border-border-secondary bg-surface-elevated/50 space-y-2 rounded-2xl border p-4">
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

          <div className="border-border-secondary bg-surface-elevated/50 space-y-2 rounded-2xl border p-4">
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

          <h2 className="font-heading font-bold">Voting Params</h2>
          <div className="border-border-secondary bg-surface-elevated/50 space-y-2 rounded-2xl border p-4">
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
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border-secondary bg-surface-elevated p-1">
            {tabs.map((t) => (
              <Button
                key={t.label}
                variant={t.label === tab ? "active" : "inactive"}
                className="shrink-0 rounded-full"
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
