"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { links } from "@/config/link"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { SafeImage } from "@/components/safe-image"
import { StakeDialog } from "@/components/stake-dialog"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"

const SIDEBAR_ACTION_CLASS =
  "h-10 min-w-0 flex-1 rounded-full px-3 text-sm font-semibold"

const STAKE_CTA_CLASS = cn(
  SIDEBAR_ACTION_CLASS,
  "border-2 border-white/[0.12] [box-shadow:var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)]"
)

const MANAGE_CTA_CLASS = cn(SIDEBAR_ACTION_CLASS, "w-full")

function SidebarCollapsiblePanel({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <GlassCard tone="chart" contentClassName="p-0" className="rounded-3xl">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
          <span className="font-heading text-base font-bold">{title}</span>
          {open ? (
            <ChevronDown className="text-tertiary size-5 shrink-0" />
          ) : (
            <ChevronRight className="text-tertiary size-5 shrink-0" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-white/5 px-4 pb-4 pt-2">
          {children}
        </CollapsibleContent>
      </GlassCard>
    </Collapsible>
  )
}

function InfoRow({
  label,
  value,
  isLoading,
}: {
  label: string
  value: React.ReactNode
  isLoading?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="text-tertiary font-medium">{label}</span>
      {isLoading ? (
        <Skeleton className="h-5 w-20" />
      ) : (
        <span className="text-foreground text-end font-medium">{value}</span>
      )}
    </div>
  )
}

function AddressRow({
  label,
  value,
  isLoading,
  contentType,
}: {
  label: string
  value: string
  isLoading?: boolean
  contentType: "commissionReceiver" | "governanceAuthorized"
}) {
  return (
    <div className="space-y-1 py-1">
      <div className="text-tertiary text-sm font-medium">{label}</div>
      {isLoading ? (
        <Skeleton className="h-5 w-full" />
      ) : (
        <div className="flex min-w-0 items-center gap-1 font-mono text-xs">
          <span className="truncate">
            {value.slice(0, 10)}...{value.slice(-8)}
          </span>
          <Button
            variant="ghost"
            size="iconXs"
            className="text-tertiary shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(value)
              toast.success("Copied to clipboard")
              track("CopyToClipboard", { contentType })
            }}
          >
            <Copy />
          </Button>
          <Button
            variant="ghost"
            size="iconXs"
            className="text-tertiary shrink-0"
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
  )
}

export function OperatorSidebar({
  id,
  operator,
  imageUrl,
  name,
}: {
  id: string
  operator: OperatorWithSharesAndBaseApy | undefined
  imageUrl?: string
  name?: string
}) {
  const isLoading = !operator

  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 lg:w-[320px]">
      <GlassCard
        tone="chart"
        className="rounded-3xl"
        contentClassName="p-0"
        innerClassName="gap-0"
      >
        <div className="flex gap-3 p-4">
          <SafeImage
            src={imageUrl}
            alt={name ?? id}
            className="size-16 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-foreground text-2xl font-bold leading-8">
              {name ?? <Skeleton className="h-8 w-32" />}
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-tertiary font-mono text-sm font-medium">
                {id.slice(0, 8)}...{id.slice(-5)}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={() => {
                    navigator.clipboard.writeText(id)
                    toast.success("Copied to clipboard")
                    track("CopyToClipboard", { contentType: "operatorId" })
                  }}
                >
                  <Copy className="size-4" />
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
                    <ExternalLink className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-border-secondary/40 border-y">
          <div className="grid grid-cols-2">
            {[
              {
                label: "Total Stake (WAL)",
                value: operator
                  ? formatter.numberReadable(operator.staked)
                  : null,
              },
              {
                label: "Reward Pool (WAL)",
                value: operator
                  ? formatter.numberReadable(operator.rewardsPool)
                  : null,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="space-y-1 border-border-secondary/40 border-b p-3 odd:border-r"
              >
                <div className="text-tertiary text-sm">{label}</div>
                {isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <div className="font-heading text-lg font-bold">{value}</div>
                )}
              </div>
            ))}
            {[
              {
                label: "Pool share",
                value: operator
                  ? formatter.percentage(operator.pct, { percent: false })
                  : null,
                suffix: "%",
              },
              {
                label: "Commission",
                value: operator
                  ? formatter.percentage(operator.commissionRate, {
                      percent: false,
                    })
                  : null,
                suffix: "%",
                className: "text-success-foreground",
              },
            ].map(({ label, value, suffix, className }) => (
              <div
                key={label}
                className="space-y-1 p-3 odd:border-r odd:border-border-secondary/40"
              >
                <div className="text-tertiary text-sm">{label}</div>
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <div
                    className={cn(
                      "font-heading text-lg font-bold",
                      className
                    )}
                  >
                    {value}
                    {suffix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 p-3">
          {operator ? (
            <StakeDialog operator={operator}>
              <Button variant="purple" className={STAKE_CTA_CLASS}>
                Stake
              </Button>
            </StakeDialog>
          ) : (
            <Button variant="purple" className={STAKE_CTA_CLASS} disabled>
              Stake
            </Button>
          )}
          <Link href="/profile" className="min-w-0 flex-1">
            <Button variant="outline" className={MANAGE_CTA_CLASS}>
              Manage
            </Button>
          </Link>
        </div>
      </GlassCard>

      <SidebarCollapsiblePanel title="Epoch Info" defaultOpen>
        <div className="space-y-0.5">
          <InfoRow
            label="Pending Stake"
            isLoading={isLoading}
            value={
              operator
                ? `${formatter.numberReadable(operator.pendingStake)} WAL`
                : null
            }
          />
          <InfoRow
            label="Pending Shares Withdraw"
            isLoading={isLoading}
            value={
              operator
                ? `${formatter.numberReadable(operator.pendingSharesWithdraw)} WAL`
                : null
            }
          />
          <InfoRow
            label="Pre Active Withdrawals"
            isLoading={isLoading}
            value={
              operator
                ? `${formatter.numberReadable(operator.preActiveWithdrawals)} WAL`
                : null
            }
          />
          <InfoRow
            label="Activation Epoch"
            isLoading={isLoading}
            value={operator ? operator.activationEpoch : null}
          />
          <InfoRow
            label="Latest Epoch"
            isLoading={isLoading}
            value={operator ? operator.latestEpoch : null}
          />
          <InfoRow
            label="Next epoch commission"
            isLoading={isLoading}
            value={
              operator
                ? formatter.percentage(operator.commissionRate)
                : null
            }
          />
        </div>
      </SidebarCollapsiblePanel>

      <SidebarCollapsiblePanel title="Address">
        <AddressRow
          label="Commission receiver"
          value={operator?.commissionReceiver ?? ""}
          isLoading={isLoading}
          contentType="commissionReceiver"
        />
        <AddressRow
          label="Governace authorized"
          value={operator?.governaceAuthorized ?? ""}
          isLoading={isLoading}
          contentType="governanceAuthorized"
        />
      </SidebarCollapsiblePanel>

      <SidebarCollapsiblePanel title="Voting Param">
        <div className="space-y-0.5">
          <InfoRow
            label="Node Capacity"
            isLoading={isLoading}
            value={
              operator ? `${formatter.number(operator.capacityTB)} TB` : null
            }
          />
          <InfoRow
            label="Storage Price"
            isLoading={isLoading}
            value={
              operator
                ? `${formatter.number(operator.storagePrice)} FROST`
                : null
            }
          />
          <InfoRow
            label="Write Price"
            isLoading={isLoading}
            value={
              operator ? `${formatter.number(operator.writePrice)} FROST` : null
            }
          />
          <InfoRow
            label="Number of Shards"
            isLoading={isLoading}
            value={operator ? operator.weight : null}
          />
        </div>
      </SidebarCollapsiblePanel>
    </aside>
  )
}
