"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
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
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Copy,
  Search,
  TrendingUp,
} from "lucide-react"
import { CartesianGrid, Line, LineChart, YAxis } from "recharts"
import { toast } from "sonner"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { images } from "@/config/image"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useOperatorsWithSharesAndBaseApy } from "@/hooks/use-operators"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
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
import { CircleCountdown } from "@/components/circle-countdown"
import { GradientBorderCard } from "@/components/gradient-border-card"

const staked = {
  "0xf11fef95c8c5a17c2cbc51c15483e38585cf996110b8d50b8e1957442dc736fd": {
    amount: "42",
    value: "115",
  },
} as Record<string, { amount: string; value: string }>

const apyData = [
  { date: "Jan 10, 2025", value: 15 },
  { date: "Jan 20, 2025", value: 25 },
  { date: "Jan 30, 2025", value: 18 },
  { date: "Feb 10, 2025", value: 30 },
  { date: "Feb 20, 2025", value: 22 },
  { date: "Feb 28, 2025", value: 28 },
  { date: "Mar 10, 2025", value: 20 },
  { date: "Mar 20, 2025", value: 27 },
  { date: "Mar 30, 2025", value: 19 },
  { date: "Apr 10, 2025", value: 31 },
  { date: "Apr 20, 2025", value: 23 },
  { date: "Apr 30, 2025", value: 29 },
  { date: "May 10, 2025", value: 21 },
  { date: "May 20, 2025", value: 26 },
  { date: "May 30, 2025", value: 17 },
  { date: "Jun 10, 2025", value: 32 },
  { date: "Jun 20, 2025", value: 24 },
  { date: "Jun 30, 2025", value: 28 },
  { date: "Jul 10, 2025", value: 20 },
  { date: "Jul 20, 2025", value: 27 },
]
const stakedData = [
  { date: "Jan 10, 2025", value: 10 },
  { date: "Feb 10, 2025", value: 10 },
  { date: "Mar 10, 2025", value: 11 },
  { date: "Apr 10, 2025", value: 11 },
  { date: "May 10, 2025", value: 12 },
  { date: "Jun 10, 2025", value: 12 },

  { date: "Jul 10, 2025", value: 12 },
  { date: "Aug 10, 2025", value: 12 },
]

export default function Home() {
  const operators = useOperatorsWithSharesAndBaseApy()

  const columns = useMemo(
    () =>
      [
        {
          header: "Name/ID",
          accessorKey: "name",
          enableSorting: false,
          cell: ({ row }) => {
            const operator = row.original
            return (
              <div>
                <div className="line-clamp-1 inline-flex w-min items-center gap-1 truncate font-medium">
                  {operator.name}
                  {operator.isCommittee && (
                    <Badge variant="accentPurple" size="sm" className="">
                      Committee
                    </Badge>
                  )}
                </div>
                <div className="text-tertiary flex items-center gap-1 font-mono text-xs">
                  {operator.id.slice(0, 8)}...{operator.id.slice(-8)}{" "}
                  <Button
                    size="iconXs"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(operator.id)
                      toast.success("Copied to clipboard")
                    }}
                  >
                    <Copy />
                  </Button>
                </div>
              </div>
            )
          },
        },
        {
          header: "APY",
          id: "apyWithCommission",
          accessorKey: "apyWithCommission",
          enableSorting: true,
          cell: ({ row }) => {
            return (
              <div className="text-accent-blue font-bold">
                {formatter.percentage(row.original.apyWithCommission)}
              </div>
            )
          },
        },
        {
          header: "Voting Weight",
          accessorKey: "pct",
          enableSorting: true,
          cell: ({ row }) => {
            return (
              <div>
                {formatter.percentage(row.original.pct, { percent: false })}
                <span className="text-tertiary">%</span>
              </div>
            )
          },
        },
        {
          header: "Commission",
          accessorKey: "commissionRate",
          enableSorting: true,
          sortDescFirst: false,
          cell: ({ row }) => {
            return (
              <div>
                {formatter.percentage(row.original.commissionRate, {
                  percent: false,
                })}
                <span className="text-tertiary">%</span>
              </div>
            )
          },
        },
        {
          id: "staked",
          header: "Total Staked",
          accessorKey: "staked",
          enableSorting: true,
          cell: ({ row }) => {
            if (!row.original.staked)
              return <div className="text-tertiary">-</div>
            return (
              <div>{formatter.numberReadable(row.original.staked)} WAL</div>
            )
          },
        },
        {
          id: "yourStake",
          header: "Your Stake",
          accessorKey: "yourStake",
          enableSorting: false,
          cell: ({ row }) => {
            const s = staked[row.original.id]
            if (!s) return <div className="text-tertiary text-end">-</div>
            return (
              <div className="text-end">{formatter.number(s?.amount)} WAL</div>
            )
          },
        },
        {
          id: "action",
          header: "Action",
          accessorKey: "action",
          enableSorting: false,
          cell: ({ row }) => {
            return (
              <div className="text-end">
                <Button variant="purpleSecondary" size="xs">
                  Unstake
                </Button>
              </div>
            )
          },
        },
      ] satisfies ColumnDef<OperatorWithSharesAndBaseApy>[],
    [staked]
  )

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "staked",
      desc: true,
    },
  ])
  const [globalFilter, setGlobalFilter] = useState<any>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: operators.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    sortDescFirst: true,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <CircleCountdown className="size-[256px] shrink-0" />
        <div className="shrink-0 space-y-2">
          <GradientBorderCard>
            <div>Average Staking APY%</div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-foreground text-2xl font-bold">
                  22% APY
                </div>
                <div>MAX APY% 60%</div>
              </div>
              <ChartContainer
                config={{
                  value: {
                    color: "var(--color-success-foreground)",
                    label: "APY%",
                  },
                }}
                className="h-[56px] w-[83px]"
              >
                <LineChart data={apyData}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </GradientBorderCard>
          <div className="flex items-center gap-2">
            <GradientBorderCard className="h-full">
              <div>WAL Price</div>
              <img src={images.wal} alt="WAL" className="my-1 size-6" />
              <div className="flex items-center gap-1">
                <div className="text-foreground font-bold">$0.045</div>
                <TrendingUp className="text-success-foreground size-4" />
                <div className="text-success-foreground">+1.2%</div>
              </div>
            </GradientBorderCard>
            <GradientBorderCard>
              <div>Total CEX Flow</div>
              <div className="text-foreground mt-7 font-bold">13.25M WAL</div>
            </GradientBorderCard>
          </div>
          <GradientBorderCard>
            <div className="flex items-center gap-2">
              <div>Circulating Supply</div>
              <div className="text-foreground ml-auto font-bold">$1.38B</div>
            </div>
          </GradientBorderCard>
        </div>
        <GradientBorderCard className="h-full w-full">
          <div>Total Staked</div>
          <div className="text-foreground text-xl">2,200,444 WAL</div>
          <ChartContainer
            className="mt-2 max-h-[170px] w-full"
            config={{
              value: {
                color: "var(--color-accent-blue)",
                label: "Staked",
              },
            }}
          >
            <LineChart data={stakedData}>
              <CartesianGrid vertical={false} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </GradientBorderCard>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="active" size="sm">
          Staking
        </Button>
        <Button disabled variant="inactive" size="sm">
          Ecosystem
        </Button>
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="shrink-0 space-y-2">
            <GradientBorderCard>
              <div>Shards</div>
              <div className="text-foreground text-base font-bold">1,000</div>
              <div>Individual Data Partitions</div>
            </GradientBorderCard>
            <div className="flex items-center gap-2">
              <GradientBorderCard>
                <div>Storage Price</div>
                <div className="text-foreground text-base font-bold">
                  11,000
                </div>
                <div>Frost/MiB/Epoch</div>
              </GradientBorderCard>
              <GradientBorderCard>
                <div>Write Price</div>
                <div className="text-foreground text-base font-bold">
                  20,000
                </div>
                <div>Frost/MiB</div>
              </GradientBorderCard>
            </div>
          </div>
          <GradientBorderCard className="h-full w-full">
            <div>Total Storage Usage</div>
            <div className="text-foreground text-xl">311,572 TB</div>
            <ChartContainer
              className="mt-2 max-h-[100px] w-full"
              config={{
                value: {
                  color: "var(--color-accent-purple)",
                  label: "Storage Usage (TB)",
                },
              }}
            >
              <LineChart data={stakedData}>
                <CartesianGrid vertical={false} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </GradientBorderCard>
          <GradientBorderCard className="h-full w-full">
            <div>Total Paid Fee</div>
            <div className="text-foreground text-xl">1048.16 WAL</div>
            <ChartContainer
              className="mt-2 max-h-[100px] w-full"
              config={{
                value: {
                  color: "var(--color-accent-purple)",
                  label: "Total Paid Fee (WAL)",
                },
              }}
            >
              <LineChart data={stakedData}>
                <CartesianGrid vertical={false} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </GradientBorderCard>
        </div>
        <div className="flex items-center gap-2">
          <div className="font-semibold">All Operators</div>
          <div className="bg-accent-purple text-primary-foreground rounded-full px-2 py-1 text-xs font-bold">
            200
          </div>
          <div className="flex-1" />
          <div className="relative md:w-[330px]">
            <Input
              placeholder="Enter Operator Name"
              className="pl-10"
              onChange={(e) => table.setGlobalFilter(e.target.value)}
            />
            <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          </div>
          <Button variant="outline">
            All Operators <ChevronDown className="size-4" />
          </Button>
          <Link href="/profile">
            <Button variant="purple">Manage your staking</Button>
          </Link>
        </div>
        <Table className="max-w-auto">
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
                      onClick={() => canSort && header.column.toggleSorting()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
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
            {operators.isPending ? (
              _.range(10).map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-3/4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
            ) : (
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
      </div>
    </div>
  )
}
