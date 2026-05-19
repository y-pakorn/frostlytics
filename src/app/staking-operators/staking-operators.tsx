"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useCurrentAccount } from "@mysten/dapp-kit"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import _ from "lodash"
import debounce from "lodash/debounce"
import {
  ArrowRight,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Search,
} from "lucide-react"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { GlassPill } from "@/components/ui/glass-pill"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OperatorHeader } from "@/components/operator-header"
import { StakeDialog } from "@/components/stake-dialog"
import { useFullOperators, useStakedWal } from "@/hooks"

import { OperatorRowCard } from "../_components/operator-row-card"

const STAKE_CTA_CLASS =
  "h-auto rounded-full border-2 border-white/[0.12] px-3 py-2 text-sm font-semibold [box-shadow:var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)]"

const operatorTypeFilters = [
  { label: "All Operators", value: "all" as const },
  { label: "Committee", value: true },
  { label: "Not-Committee", value: false },
] as const

const TABLE_HEAD_CLASS =
  "h-11 border-0 bg-[rgba(50,40,84,0.9)] px-6 py-3 text-xs font-semibold tracking-normal text-foreground normal-case shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"

const TABLE_CELL_CLASS =
  "h-16 border-border-secondary/40 border-b px-6 py-3 first:pl-6 last:pr-6"

export default function StakingOperatorsPage() {
  const fullOperators = useFullOperators()
  const account = useCurrentAccount()
  const stakedWal = useStakedWal({ address: account?.address })

  const stakedWalByNodeId = useMemo(() => {
    return _.chain(stakedWal.data)
      .groupBy("nodeId")
      .mapValues((v) => ({
        amount: _.sumBy(v, "amount"),
        count: v.length,
      }))
      .value()
  }, [stakedWal])

  const columns = useMemo(
    () =>
      [
        {
          header: "Name / ID",
          accessorKey: "name",
          enableSorting: false,
          filterFn: "isCommittee" as any,
          cell: ({ row }) => <OperatorHeader operator={row.original} />,
        },
        {
          header: () => (
            <div className="ml-auto text-end">Voting Weight</div>
          ),
          accessorKey: "pct",
          enableSorting: true,
          cell: ({ row }) => (
            <div className="text-tertiary text-end font-medium">
              {formatter.percentage(row.original.pct, { percent: false })}
              <span className="text-tertiary">%</span>
            </div>
          ),
        },
        {
          header: () => <div className="ml-auto text-end">APY%</div>,
          id: "apyWithCommission",
          accessorKey: "apyWithCommission",
          enableSorting: true,
          cell: ({ row }) => (
            <div className="text-success-foreground text-end font-medium">
              {formatter.percentage(row.original.apyWithCommission)}
            </div>
          ),
        },
        {
          header: () => <div className="ml-auto text-end">Commission</div>,
          accessorKey: "commissionRate",
          enableSorting: true,
          sortDescFirst: false,
          cell: ({ row }) => (
            <div className="text-end font-medium">
              {formatter.percentage(row.original.commissionRate, {
                percent: false,
              })}
              <span className="text-tertiary">%</span>
            </div>
          ),
        },
        {
          id: "staked",
          header: () => <div className="ml-auto text-end">Total Stake</div>,
          accessorKey: "staked",
          enableSorting: true,
          cell: ({ row }) =>
            !row.original.staked ? (
              <div className="text-tertiary text-end">-</div>
            ) : (
              <div className="text-secondary-foreground text-end">
                {formatter.numberReadable(row.original.staked)} WAL
              </div>
            ),
        },
        {
          id: "position",
          header: () => <div className="ml-auto text-end">Position</div>,
          accessorFn: (row) => stakedWalByNodeId[row.id]?.amount,
          enableSorting: true,
          sortDescFirst: true,
          sortUndefined: "last",
          cell: ({ row }) => {
            const s = stakedWalByNodeId[row.original.id]
            if (s?.amount) {
              return (
                <div className="flex items-center justify-end gap-2">
                  <div className="text-end">
                    <div className="text-brand-300 text-sm font-semibold">
                      {formatter.number(s.amount)} WAL
                    </div>
                    <div className="text-tertiary text-xs">
                      {s.count} position{s.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="iconSm"
                    className="rounded-full"
                    asChild
                  >
                    <Link
                      href={
                        account?.address
                          ? `/profile?addr=${account.address}`
                          : "/profile"
                      }
                    >
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              )
            }
            return (
              <div className="flex justify-end">
                <StakeDialog operator={row.original}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Stake
                  </Button>
                </StakeDialog>
              </div>
            )
          },
        },
      ] satisfies ColumnDef<OperatorWithSharesAndBaseApy>[],
    [account?.address, stakedWalByNodeId]
  )

  const trackSearch = useCallback(
    debounce((query: string) => {
      if (query) track("TableSearch", { table: "operators", query })
    }, 500),
    []
  )

  const [sorting, setSorting] = useState<SortingState>([
    { id: "staked", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const data = useMemo(() => fullOperators || [], [fullOperators])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    filterFns: {
      isCommittee: (row, _columnId, filterValue) =>
        row.original.isCommittee === filterValue,
    },
    state: { sorting, globalFilter, columnFilters },
    sortDescFirst: true,
    initialState: { pagination: { pageSize: 10 } },
  })

  const activeFilterValue =
    columnFilters[0]?.value === undefined
      ? "all"
      : String(columnFilters[0]?.value)

  const activeFilterLabel =
    operatorTypeFilters.find(
      (item) =>
        item.value === "all"
          ? activeFilterValue === "all"
          : String(item.value) === activeFilterValue
    )?.label ?? "All Operators"

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-foreground text-2xl font-bold">
        Staking & Operators
      </h1>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-foreground text-base font-semibold">
              All Operators
            </p>
            <Badge variant="epoch">{table.getFilteredRowModel().rows.length}</Badge>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <GlassInput
              className="w-full md:w-[320px]"
              containerClassName="w-full md:w-[320px]"
              icon={<Search className="size-4" />}
              onChange={(e) => {
                table.setGlobalFilter(e.target.value)
                trackSearch(e.target.value)
              }}
              placeholder="Enter Operator Name"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <GlassPill
                  type="button"
                  contentClassName="font-semibold text-secondary-foreground gap-1"
                >
                  {activeFilterLabel}
                  <ChevronDown className="size-4" />
                </GlassPill>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" variant="glass">
                <DropdownMenuLabel>Filter by operator type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeFilterValue}>
                  {operatorTypeFilters.map((item) => (
                    <DropdownMenuRadioItem
                      key={item.label}
                      value={
                        item.value === "all" ? "all" : String(item.value)
                      }
                      onSelect={() => {
                        if (item.value === "all") {
                          table.setColumnFilters([])
                        } else {
                          table.setColumnFilters([
                            { id: "name", value: item.value },
                          ])
                        }
                        track("TableFilter", {
                          table: "operators",
                          filterValue: item.label,
                        })
                      }}
                    >
                      {item.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="purple"
              size="sm"
              className={STAKE_CTA_CLASS}
              asChild
            >
              <Link href="/profile">Your Position</Link>
            </Button>
          </div>
        </div>

        <div className="hidden md:block">
          <GlassCard
            tone="chart"
            contentClassName="overflow-hidden p-0"
            className="rounded-3xl"
          >
            <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-0 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header, index) => {
                    const sorted = header.column.getIsSorted()
                    const canSort = header.column.getCanSort()
                    const Icon =
                      sorted === "asc"
                        ? ChevronUp
                        : sorted === "desc"
                          ? ChevronDown
                          : ChevronsUpDown
                    const isFirst = index === 0
                    const isLast = index === headerGroup.headers.length - 1
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          TABLE_HEAD_CLASS,
                          canSort && "cursor-pointer select-none",
                          isFirst && "rounded-l-full",
                          isLast && "rounded-r-full",
                          !isFirst && header.id !== "name" && "text-end"
                        )}
                        onClick={() => {
                          if (canSort) {
                            header.column.toggleSorting()
                            track("TableSort", {
                              table: "operators",
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
                            !isFirst &&
                              header.id !== "name" &&
                              "justify-end"
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort && (
                            <Button variant="ghost" size="iconXs">
                              <Icon />
                            </Button>
                          )}
                        </div>
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {!fullOperators
                ? _.range(10).map((i) => (
                    <TableRow key={i} className="border-0 hover:bg-transparent">
                      <TableCell
                        colSpan={columns.length}
                        className={TABLE_CELL_CLASS}
                      >
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : table.getRowModel().rows?.length
                  ? table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-0 hover:bg-surface-elevated/40"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              TABLE_CELL_CLASS,
                              cell.column.id === "position" &&
                                stakedWalByNodeId[row.original.id]?.amount &&
                                "bg-surface-elevated/50"
                            )}
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
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
            </TableBody>
          </Table>
          </GlassCard>
        </div>

        {fullOperators && table.getPageCount() > 1 ? (
          <Pagination table={table} className="hidden px-1 md:flex" />
        ) : null}

        <div className="block space-y-2 md:hidden">
          {!fullOperators
            ? _.range(5).map((i) => (
                <Skeleton
                  key={i}
                  className="h-[220px] w-full rounded-[var(--glass-card-radius)]"
                />
              ))
            : table.getFilteredRowModel().rows.length
              ? table.getFilteredRowModel().rows.map((row) => {
                  const s = stakedWalByNodeId[row.original.id]
                  return (
                    <OperatorRowCard
                      key={row.id}
                      operator={row.original}
                      yourStake={s?.amount}
                      yourPositions={s?.count}
                    />
                  )
                })
              : (
                  <div className="text-tertiary py-8 text-center text-sm">
                    No results.
                  </div>
                )}
        </div>
      </div>
    </div>
  )
}
