"use client"

import { Search } from "lucide-react"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { track } from "@/lib/analytic"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GlassInput } from "@/components/ui/glass-input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export type ProfileStatusFilter =
  | "all"
  | "staked"
  | "withdrawing"
  | "claimable"

export function ProfileToolbar({
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  searchQuery,
  onSearchChange,
  operatorFilter,
  onOperatorFilterChange,
  operators,
}: {
  statusFilter: ProfileStatusFilter
  onStatusFilterChange: (value: ProfileStatusFilter) => void
  statusCounts: Record<ProfileStatusFilter, number>
  searchQuery: string
  onSearchChange: (value: string) => void
  operatorFilter: string | null
  onOperatorFilterChange: (operatorId: string | null) => void
  operators: OperatorWithSharesAndBaseApy[]
}) {
  const selectedOperator = operators.find((op) => op.id === operatorFilter)

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <SegmentedControl
        variant="glass"
        size="md"
        activeTone="purple"
        className="w-full lg:w-auto"
        options={(
          [
            { label: "All", value: "all" as const },
            { label: "Staked", value: "staked" as const },
            { label: "Withdrawing", value: "withdrawing" as const },
            { label: "Withdrawable", value: "claimable" as const },
          ] as const
        ).map((option) => ({
          value: option.value,
          label: (
            <span className="inline-flex items-center gap-1.5">
              {option.label}
              <Badge variant="epoch" className="px-1.5 py-0 text-[10px]">
                {statusCounts[option.value]}
              </Badge>
            </span>
          ),
        }))}
        value={statusFilter}
        onChange={(value) => {
          onStatusFilterChange(value)
          track("StakeStatusFilter", { status: value })
        }}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <GlassInput
          className="w-full sm:w-[320px]"
          containerClassName="w-full sm:w-[320px]"
          icon={<Search className="size-4" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Enter Operator Name / Position ID"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-full justify-between rounded-full sm:w-auto sm:min-w-[160px]"
            >
              <span className="truncate">
                {selectedOperator?.name ?? "All Operators"}
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent variant="glass" align="end" className="min-w-[200px]">
            <DropdownMenuRadioGroup
              value={operatorFilter ?? "all"}
              onValueChange={(value) => {
                const next = value === "all" ? null : value
                onOperatorFilterChange(next)
                track("ProfileOperatorFilter", {
                  operatorId: next ?? "all",
                })
              }}
            >
              <DropdownMenuRadioItem value="all">
                All Operators
              </DropdownMenuRadioItem>
              {operators.map((operator) => (
                <DropdownMenuRadioItem key={operator.id} value={operator.id}>
                  {operator.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
