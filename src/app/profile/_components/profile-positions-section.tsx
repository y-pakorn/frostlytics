"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import range from "lodash/range"
import startCase from "lodash/startCase"
import sumBy from "lodash/sumBy"
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { links } from "@/config/link"
import { track } from "@/lib/analytic"
import { PROFILE_PAGE_SIZE, TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from "@/lib/glass-table"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { OperatorHeader } from "@/components/operator-header"
import { Pagination } from "@/components/pagination"
import { UnstakeDialog } from "@/components/unstake-dialog"
import { WithdrawDialog } from "@/components/withdraw-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StakedWalWithStatus } from "@/types"

import { ProfileToolbar, type ProfileStatusFilter } from "./profile-toolbar"
import { StakingRowCard } from "./staking-row-card"

function StatusBadge({ status }: { status: StakedWalWithStatus["status"] }) {
  const label = status === "claimable" ? "Withdrawable" : startCase(status)
  return (
    <Badge
      variant={
        status === "staked"
          ? "success"
          : status === "claimable"
            ? "accentPurpleOutline"
            : "outline"
      }
      className="text-[10px]"
    >
      {label}
    </Badge>
  )
}

export function ProfilePositionsSection({
  readOnly,
  stakedWalWithStatus,
  validatorMap,
  estimatedRewards,
}: {
  readOnly?: boolean
  stakedWalWithStatus: StakedWalWithStatus[] | null
  validatorMap: Record<string, OperatorWithSharesAndBaseApy>
  estimatedRewards: Record<string, number> | undefined
}) {
  const [statusFilter, setStatusFilter] = useState<ProfileStatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [operatorFilter, setOperatorFilter] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "amount", desc: true },
  ])

  const operatorsInPositions = useMemo(() => {
    if (!stakedWalWithStatus) return []
    const ids = Array.from(new Set(stakedWalWithStatus.map((s) => s.nodeId)))
    return ids
      .map((id) => validatorMap[id])
      .filter((op): op is OperatorWithSharesAndBaseApy => !!op)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [stakedWalWithStatus, validatorMap])

  const statusCounts = useMemo(() => {
    const rows = stakedWalWithStatus ?? []
    return {
      all: rows.length,
      staked: rows.filter((s) => s.status === "staked").length,
      withdrawing: rows.filter((s) => s.status === "withdrawing").length,
      claimable: rows.filter((s) => s.status === "claimable").length,
    } satisfies Record<ProfileStatusFilter, number>
  }, [stakedWalWithStatus])

  const filteredData = useMemo(() => {
    let rows = stakedWalWithStatus ?? []
    if (statusFilter !== "all") {
      rows = rows.filter((s) => s.status === statusFilter)
    }
    if (operatorFilter) {
      rows = rows.filter((s) => s.nodeId === operatorFilter)
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      rows = rows.filter((s) => {
        const operator = validatorMap[s.nodeId]
        return (
          s.id.toLowerCase().includes(q) ||
          s.nodeId.toLowerCase().includes(q) ||
          (operator?.name.toLowerCase().includes(q) ?? false)
        )
      })
    }
    return rows
  }, [
    stakedWalWithStatus,
    statusFilter,
    operatorFilter,
    searchQuery,
    validatorMap,
  ])

  useEffect(() => {
    setOperatorFilter(null)
  }, [stakedWalWithStatus?.length])

  const columns = useMemo(() => {
    return [
      {
        header: "Name / ID",
        accessorFn: (row) => validatorMap[row.nodeId]?.name || row.nodeId,
        id: "name",
        enableSorting: false,
        cell: ({ row }) =>
          validatorMap[row.original.nodeId] ? (
            <OperatorHeader operator={validatorMap[row.original.nodeId]} />
          ) : (
            <Skeleton className="h-8 w-full" />
          ),
      },
      {
        header: () => <div className="ml-auto text-end">Status</div>,
        accessorKey: "status",
        id: "status",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <StatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        header: () => <div className="ml-auto text-end">Position ID</div>,
        accessorKey: "id",
        id: "positionId",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <span className="text-tertiary font-mono text-xs">
              {row.original.id.slice(0, 8)}...{row.original.id.slice(-6)}
            </span>
            <Button
              variant="ghost"
              size="iconXs"
              onClick={() => {
                navigator.clipboard.writeText(row.original.id)
                toast.success("Copied to clipboard")
                track("CopyToClipboard", { contentType: "positionId" })
              }}
            >
              <Copy />
            </Button>
            <Link href={links.object(row.original.id)} target="_blank">
              <Button variant="ghost" size="iconXs">
                <ExternalLink />
              </Button>
            </Link>
          </div>
        ),
      },
      {
        header: () => <div className="ml-auto text-end">Amount</div>,
        accessorKey: "amount",
        id: "amount",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-end">
            <span className="font-heading text-foreground font-bold">
              {formatter.number(row.original.amount)} WAL
            </span>
          </div>
        ),
      },
      {
        header: () => <div className="ml-auto text-end">Activation Ep.</div>,
        accessorKey: "activationEpoch",
        id: "activationEpoch",
        enableSorting: true,
        sortDescFirst: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <span className="bg-surface-elevated/60 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-xs font-medium">
              {row.original.activationEpoch}
            </span>
          </div>
        ),
      },
      ...(readOnly
        ? []
        : ([
            {
              header: () => <div className="ml-auto text-end">Actions</div>,
              id: "action",
              enableSorting: false,
              cell: ({ row }) => {
                const reward = estimatedRewards?.[row.original.id] ?? 0
                if (row.original.status === "withdrawing") {
                  return (
                    <div className="text-disabled text-end text-xs font-semibold">
                      Withdrawable in Epoch {row.original.withdrawEpoch}
                    </div>
                  )
                }
                if (row.original.canWithdrawRightNow) {
                  return (
                    <div className="text-end">
                      <WithdrawDialog
                        stakedWal={[row.original]}
                        estimatedReward={reward}
                      >
                        <Button
                          variant="link"
                          className="text-brand-400 h-auto p-0 font-semibold"
                        >
                          Withdraw
                        </Button>
                      </WithdrawDialog>
                    </div>
                  )
                }
                return (
                  <div className="text-end">
                    <UnstakeDialog
                      stakedWal={row.original}
                      operator={validatorMap[row.original.nodeId] || null}
                      estimatedReward={reward}
                    >
                      <Button
                        variant="link"
                        className="text-error-foreground h-auto p-0 font-semibold"
                      >
                        Unstake
                      </Button>
                    </UnstakeDialog>
                  </div>
                )
              },
            },
          ] satisfies ColumnDef<StakedWalWithStatus>[])),
    ] satisfies ColumnDef<StakedWalWithStatus>[]
  }, [validatorMap, estimatedRewards, readOnly])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: {
      pagination: { pageSize: PROFILE_PAGE_SIZE },
    },
  })

  useEffect(() => {
    table.setPageIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, operatorFilter, searchQuery])

  const claimablePositions =
    stakedWalWithStatus?.filter((s) => s.canWithdrawRightNow) ?? []

  if (stakedWalWithStatus?.length === 0) {
    return (
      <GlassCard
        tone="chart"
        className="rounded-3xl"
        contentClassName="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center"
      >
        <p className="text-secondary-foreground font-medium">
          No staked validators yet.
          <br />
          Get started by finding an operator to stake with.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/operator">Find Operators</Link>
        </Button>
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ProfileToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={statusCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        operatorFilter={operatorFilter}
        onOperatorFilterChange={setOperatorFilter}
        operators={operatorsInPositions}
      />

      <div className="hidden md:block">
        <GlassCard
          tone="chart"
          className="rounded-3xl"
          contentClassName="overflow-hidden p-0"
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-0 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header, index) => {
                    const isFirst = index === 0
                    const isLast = index === headerGroup.headers.length - 1
                    const sorted = header.column.getIsSorted()
                    const canSort = header.column.getCanSort()
                    const Icon =
                      sorted === "asc"
                        ? ChevronUp
                        : sorted === "desc"
                          ? ChevronDown
                          : ChevronsUpDown

                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          TABLE_HEAD_CLASS,
                          isFirst && "rounded-l-full",
                          isLast && "rounded-r-full",
                          !isFirst && header.id !== "name" && "text-end",
                          canSort && "cursor-pointer select-none"
                        )}
                        onClick={() => {
                          if (canSort) {
                            header.column.toggleSorting()
                            track("TableSort", {
                              table: "staking",
                              column: header.id,
                              direction:
                                header.column.getIsSorted() === "desc"
                                  ? "asc"
                                  : "desc",
                            })
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            !isFirst && header.id !== "name" && "justify-end"
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort ? <Icon className="size-3.5 opacity-60" /> : null}
                        </div>
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {!stakedWalWithStatus
                ? range(10).map((i) => (
                    <TableRow
                      key={i}
                      className="border-0 hover:bg-transparent"
                    >
                      <TableCell
                        colSpan={columns.length}
                        className={TABLE_CELL_CLASS}
                      >
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : table.getRowModel().rows.length
                  ? table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-0 hover:bg-surface-elevated/40"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={TABLE_CELL_CLASS}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : (
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableCell
                        colSpan={columns.length}
                        className={cn(TABLE_CELL_CLASS, "h-24 text-center")}
                      >
                        <span className="text-tertiary text-sm">
                          No positions match your filters.
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
            </TableBody>
          </Table>
        </GlassCard>
      </div>

      <div className="space-y-2 md:hidden">
        {!stakedWalWithStatus
          ? range(5).map((i) => (
              <Skeleton
                key={i}
                className="h-[220px] w-full rounded-[var(--glass-card-radius)]"
              />
            ))
          : table.getRowModel().rows.map((row) => (
              <StakingRowCard
                key={row.id}
                stakedWal={row.original}
                operator={validatorMap[row.original.nodeId]}
                estimatedReward={estimatedRewards?.[row.original.id] ?? 0}
                readOnly={readOnly}
              />
            ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!readOnly ? (
          <WithdrawDialog
            stakedWal={claimablePositions}
            estimatedReward={sumBy(
              claimablePositions,
              (s) => estimatedRewards?.[s.id] ?? 0
            )}
            isWithdrawAll
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={!claimablePositions.length}
            >
              Withdraw All
            </Button>
          </WithdrawDialog>
        ) : (
          <div />
        )}

        {table.getPageCount() > 1 ? (
          <Pagination table={table} />
        ) : null}
      </div>
    </div>
  )
}
