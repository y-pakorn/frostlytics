"use client"

import { Search } from "lucide-react"

import { track } from "@/lib/analytic"
import { Badge } from "@/components/ui/badge"
import { GlassInput } from "@/components/ui/glass-input"
import { SegmentedControl } from "@/components/ui/segmented-control"

export type OperatorTabLabel = "Delegators" | "Delegations" | "Transactions"

const TAB_OPTIONS: { label: string; value: OperatorTabLabel }[] = [
  { label: "Delegators", value: "Delegators" },
  { label: "Delegations", value: "Delegations" },
  { label: "Transactions", value: "Transactions" },
]

const SEARCH_PLACEHOLDER: Record<OperatorTabLabel, string> = {
  Delegators: "Enter Delegator Address",
  Delegations: "Enter Delegator Address",
  Transactions: "Enter Transaction Hash",
}

export function OperatorTabToolbar({
  operatorId,
  tab,
  onTabChange,
  searchQuery,
  onSearchChange,
  delegatorTotal,
}: {
  operatorId: string
  tab: OperatorTabLabel
  onTabChange: (tab: OperatorTabLabel) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  delegatorTotal?: number
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          variant="glass"
          size="md"
          activeTone="purple"
          className="max-w-full overflow-x-auto"
          options={TAB_OPTIONS.map((option) => ({
            ...option,
            label:
              option.value === "Delegators" && delegatorTotal != null ? (
                <span className="inline-flex items-center gap-1.5">
                  Delegators
                  <Badge variant="epoch" className="px-1.5 py-0 text-[10px]">
                    {delegatorTotal >= 1000
                      ? `${(delegatorTotal / 1000).toFixed(1)}k`
                      : delegatorTotal}
                  </Badge>
                </span>
              ) : (
                option.label
              ),
          }))}
          value={tab}
          onChange={(value) => {
            onTabChange(value)
            track("TabChange", { tabName: value, operatorId })
            window.history.replaceState(
              null,
              "",
              `/operator?id=${operatorId}&tab=${value}`
            )
          }}
        />
      </div>
      <GlassInput
        className="w-full sm:w-[320px]"
        containerClassName="w-full sm:w-[320px]"
        icon={<Search className="size-4" />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={SEARCH_PLACEHOLDER[tab]}
      />
    </div>
  )
}
