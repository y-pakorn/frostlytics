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
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import _ from "lodash"
import debounce from "lodash/debounce"
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Search,
} from "lucide-react"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Surface } from "@/components/ui/surface"
import { OperatorHeader } from "@/components/operator-header"
import { StakeDialog } from "@/components/stake-dialog"
import { useFullOperators, useStakedWal } from "@/hooks"

import { OperatorRowCard } from "../_components/operator-row-card"

const operatorTypeFilters = [
  { label: "All Operators", value: undefined },
  { label: "Committee", value: true },
  { label: "Not-Committee", value: false },
] as const

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
          header: "Name/ID",
          accessorKey: "name",
          enableSorting: false,
          filterFn: "isCommittee" as any,
          cell: ({ row }) => <OperatorHeader operator={row.original} />,
        },
        {
          header: "APY",
          id: "apyWithCommission",
          accessorKey: "apyWithCommission",
          enableSorting: true,
          cell: ({ row }) => (
            <div className="text-accent-teal font-bold">
              {formatter.percentage(row.original.apyWithCommission)}
            </div>
          ),
        },
        {
          header: "Voting Weight",
          accessorKey: "pct",
          enableSorting: true,
          cell: ({ row }) => (
            <div>
              {formatter.percentage(row.original.pct, { percent: false })}
              <span className="text-tertiary">%</span>
            </div>
          ),
        },
        {
          header: "Commission",
          accessorKey: "commissionRate",
          enableSorting: true,
          sortDescFirst: false,
          cell: ({ row }) => (
            <div>
              {formatter.percentage(row.original.commissionRate, {
                percent: false,
              })}
              <span className="text-tertiary">%</span>
            </div>
          ),
        },
        {
          id: "staked",
          header: "Total Staked",
          accessorKey: "staked",
          enableSorting: true,
          cell: ({ row }) =>
            !row.original.staked ? (
              <div className="text-tertiary">-</div>
            ) : (
              <div>{formatter.numberReadable(row.original.staked)} WAL</div>
            ),
        },
        {
          id: "yourStake",
          header: () => <div className="ml-auto text-end">Your Stake</div>,
          accessorFn: (row) => stakedWalByNodeId[row.id]?.amount,
          enableSorting: true,
          sortDescFirst: true,
          sortUndefined: "last",
          cell: ({ row }) => {
            const s = stakedWalByNodeId[row.original.id]
            if (!s) return <div className="text-tertiary text-end">-</div>
            return (
              <div className="text-end">
                <div className="font-bold">
                  {formatter.number(s.amount)} WAL
                </div>
                <div className="text-tertiary font-semibold">
                  {s.count} positions
                </div>
              </div>
            )
          },
        },
        {
          id: "action",
          header: () => <div className="ml-auto text-end">Action</div>,
          accessorKey: "action",
          enableSorting: false,
          cell: ({ row }) => (
            <div className="text-end">
              <StakeDialog operator={row.original}>
                <Button variant="purpleSecondary" size="xs">
                  Stake
                </Button>
              </StakeDialog>
            </div>
          ),
        },
      ] satisfies ColumnDef<OperatorWithSharesAndBaseApy>[],
    [stakedWalByNodeId]
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
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-foreground text-2xl font-bold">
          Staking & Operators
        </h1>
        <p className="text-tertiary mt-1 text-sm">
          Browse validators, compare APY, and manage your stake.
        </p>
      </div>

      <Surface className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-heading font-semibold">All Operators</div>
          <span className="bg-brand-700 text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-bold">
            {table.getRowCount()}
          </span>
          <div className="hidden flex-1 md:block" />
          <div className="relative order-last w-full md:order-none md:w-[330px]">
            <Input
              className="h-10 rounded-xl pl-10"
              onChange={(e) => {
                table.setGlobalFilter(e.target.value)
                trackSearch(e.target.value)
              }}
              placeholder="Enter Operator Name"
            />
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full">
                {
                  operatorTypeFilters.find(
                    (item) => item.value === columnFilters[0]?.value
                  )?.label
                }{" "}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by operator type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={String(columnFilters[0]?.value)}>
                {operatorTypeFilters.map((item) => (
                  <DropdownMenuRadioItem
                    key={item.label}
                    value={String(item.value)}
                    onSelect={() => {
                      if (item.value === undefined) {
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
          <Link href="/profile">
            <Button variant="purple" size="sm" className="rounded-full">
              Manage your staking
            </Button>
          </Link>
        </div>

        <Table className="hidden md:table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
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
                      style={{ width: `${header.getSize()}px` }}
                      className={cn(canSort && "cursor-default select-none")}
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
                      <div className="flex items-center gap-1">
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
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : table.getRowModel().rows?.length
                ? table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>

        <div className="space-y-2 md:hidden">
          {!fullOperators
            ? _.range(5).map((i) => (
                <Skeleton key={i} className="h-[220px] w-full rounded-2xl" />
              ))
            : table.getRowModel().rows.length
              ? table.getRowModel().rows.map((row) => {
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
      </Surface>
    </div>
  )
}
