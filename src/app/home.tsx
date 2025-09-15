"use client"

import { useMemo, useState } from "react"
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
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Search,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { images } from "@/config/image"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useCirculatingSupply } from "@/hooks/use-circulating-supply"
import { usePrices } from "@/hooks/use-prices"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
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
import { CircleCountdown } from "@/components/circle-countdown"
import { GradientBorderCard } from "@/components/gradient-border-card"
import { OperatorHeader } from "@/components/operator-header"
import { StakeDialog } from "@/components/stake-dialog"
import { useFullOperators, useStakedWal, useSystem } from "@/hooks"
import { HistoricalData } from "@/types"

const operatorTypeFilters = [
  {
    label: "All Operators",
    value: undefined,
  },
  {
    label: "Committee",
    value: true,
  },
  {
    label: "Not-Committee",
    value: false,
  },
]

export default function Home({
  historicalData,
}: {
  historicalData: HistoricalData[]
}) {
  const fullOperators = useFullOperators()
  const totalStakedWAL = useMemo(() => {
    return fullOperators
      ? _.sumBy(
          fullOperators,
          (o) =>
            o.staked +
            o.pendingStake -
            o.pendingSharesWithdraw -
            o.preActiveWithdrawals
        )
      : null
  }, [fullOperators])

  const prices = usePrices()
  const circulatingSupply = useCirculatingSupply()

  const system = useSystem()

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

  const apy = useMemo(() => {
    if (!fullOperators) return null
    return {
      average:
        _.sumBy(fullOperators, "apyWithCommission") / fullOperators.length,
      max: _.maxBy(fullOperators, "apyWithCommission")!.apyWithCommission,
    }
  }, [fullOperators])

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
          cell: ({ row }) => {
            return (
              <div className="text-end">
                <StakeDialog operator={row.original}>
                  <Button variant="purpleSecondary" size="xs">
                    Stake
                  </Button>
                </StakeDialog>
              </div>
            )
          },
        },
      ] satisfies ColumnDef<OperatorWithSharesAndBaseApy>[],
    [stakedWalByNodeId]
  )

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "staked",
      desc: true,
    },
  ])
  const [globalFilter, setGlobalFilter] = useState<any>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const data = useMemo(() => {
    return fullOperators || []
  }, [fullOperators])
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
      isCommittee: (row, columnId, filterValue) => {
        return row.original.isCommittee === filterValue
      },
    },
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
          <GradientBorderCard className="space-y-1">
            <div>Average Staking APY%</div>
            <div className="flex items-center justify-between gap-2">
              <div>
                {apy ? (
                  <div className="text-foreground text-2xl font-bold">
                    {formatter.percentage(apy.average, {
                      mantissa: 3,
                    })}{" "}
                    APY
                  </div>
                ) : (
                  <Skeleton className="h-6 w-24" />
                )}
                {apy ? (
                  <div>
                    MAX APY{" "}
                    {formatter.percentage(apy.max, {
                      mantissa: 3,
                    })}
                  </div>
                ) : (
                  <Skeleton className="mt-1 h-4 w-18" />
                )}
              </div>
              <ChartContainer
                config={{
                  apyWithCommission: {
                    color: "var(--color-success-foreground)",
                    label: "APY%",
                  },
                }}
                className="h-[56px] w-[83px]"
              >
                <LineChart
                  data={fullOperators?.filter((o) => o.apyWithCommission > 0)}
                >
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        valueFormatter={(value) =>
                          formatter.percentage(value, {
                            mantissa: 3,
                          })
                        }
                      />
                    }
                  />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Line
                    type="monotone"
                    dataKey="apyWithCommission"
                    stroke="var(--color-apyWithCommission)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </GradientBorderCard>
          <GradientBorderCard className="space-y-1">
            <div>WAL Price</div>
            <img src={images.wal} alt="WAL" className="my-1 size-6" />
            {prices.data ? (
              <div className="flex items-center gap-1">
                <div className="text-foreground font-bold">
                  ${formatter.number(prices.data.wal.price)}
                </div>
                <TrendingUp
                  className={cn(
                    prices.data.wal.change24h >= 0
                      ? "text-success-foreground"
                      : "text-error-foreground scale-y-[-1]",
                    "size-4"
                  )}
                />
                <div
                  className={cn(
                    prices.data.wal.change24h >= 0
                      ? "text-success-foreground"
                      : "text-error-foreground"
                  )}
                >
                  {formatter.percentage(prices.data.wal.change24h, {
                    forceSign: true,
                  })}
                </div>
              </div>
            ) : (
              <Skeleton className="h-5 w-24" />
            )}
          </GradientBorderCard>
          <GradientBorderCard>
            <div className="flex items-center gap-2">
              <div>Circulating Supply</div>
              {circulatingSupply.data ? (
                <div className="text-foreground ml-auto font-bold">
                  {formatter.numberReadable(circulatingSupply.data)} WAL
                </div>
              ) : (
                <Skeleton className="ml-auto h-6 w-24" />
              )}
            </div>
          </GradientBorderCard>
        </div>
        <GradientBorderCard className="h-full w-full">
          <div>Total Staked</div>
          {totalStakedWAL ? (
            <div className="text-foreground text-xl">
              {formatter.number(totalStakedWAL)} WAL
            </div>
          ) : (
            <Skeleton className="h-7 w-48" />
          )}
          <ChartContainer
            className="mt-2 max-h-[180px] w-full"
            config={{
              totalStakedWAL: {
                color: "var(--color-accent-blue)",
                label: "Staked",
              },
            }}
          >
            <AreaChart
              data={historicalData}
              margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
            >
              <defs>
                <linearGradient id="totalStakedWAL" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-totalStakedWAL)"
                    stopOpacity={0.7}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-totalStakedWAL)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => dayjs(value).format("MMM D")}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    includeDate={{
                      key: "timestamp",
                      formatter: (value) => dayjs(value).format("MMM D, YYYY"),
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="totalStakedWAL"
                stroke="var(--color-totalStakedWAL)"
                fill="url(#totalStakedWAL)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
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
            <GradientBorderCard className="space-y-1">
              <div>Shards</div>
              {system ? (
                <div className="text-foreground text-base font-bold">
                  {formatter.number(system.nShards)}
                </div>
              ) : (
                <Skeleton className="h-6 w-24" />
              )}
              <div>Individual Data Partitions</div>
            </GradientBorderCard>
            <div className="flex items-center gap-2">
              <GradientBorderCard className="space-y-1">
                <div>Storage Price</div>
                {system ? (
                  <div className="text-foreground text-base font-bold">
                    {formatter.number(system.storagePrice)}
                  </div>
                ) : (
                  <Skeleton className="h-6 w-18" />
                )}
                <div>Frost/MiB/Epoch</div>
              </GradientBorderCard>
              <GradientBorderCard className="space-y-1">
                <div>Write Price</div>
                {system ? (
                  <div className="text-foreground text-base font-bold">
                    {formatter.number(system.writePrice)}
                  </div>
                ) : (
                  <Skeleton className="h-6 w-18" />
                )}
                <div>Frost/MiB</div>
              </GradientBorderCard>
            </div>
          </div>
          <GradientBorderCard className="h-full w-full">
            <div>Total Storage Usage</div>
            {system ? (
              <div className="text-foreground text-xl">
                {formatter.number(system.usedCapacityTB)} TB{" "}
                <span className="text-tertiary">
                  / {formatter.number(system.totalCapacityTB)} TB
                </span>
              </div>
            ) : (
              <Skeleton className="h-7 w-48" />
            )}
            <ChartContainer
              className="mt-2 max-h-[120px] w-full"
              config={{
                storageUsedTB: {
                  color: "var(--color-accent-purple)",
                  label: "Storage Usage (TB)",
                },
              }}
            >
              <AreaChart
                data={historicalData}
                margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
              >
                <defs>
                  <linearGradient
                    id="storageUsedTB"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-storageUsedTB)"
                      stopOpacity={0.7}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-storageUsedTB)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      includeDate={{
                        key: "timestamp",
                        formatter: (value) =>
                          dayjs(value).format("MMM D, YYYY"),
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="storageUsedTB"
                  stroke="var(--color-storageUsedTB)"
                  fill="url(#storageUsedTB)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </GradientBorderCard>
          <GradientBorderCard className="h-full w-full">
            <div>{"Today's Paid Fee"}</div>
            <div className="text-foreground text-xl">
              {formatter.number(
                historicalData[historicalData.length - 1]?.paidFeesUSD
              )}{" "}
              USD
            </div>
            <ChartContainer
              className="mt-2 max-h-[120px] w-full"
              config={{
                paidFeesUSD: {
                  color: "var(--color-accent-purple)",
                  label: "Total Paid Fee (USD)",
                },
              }}
            >
              <AreaChart
                data={historicalData}
                margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
              >
                <defs>
                  <linearGradient id="paidFeesUSD" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-paidFeesUSD)"
                      stopOpacity={0.7}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-paidFeesUSD)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      includeDate={{
                        key: "timestamp",
                        formatter: (value) =>
                          dayjs(value).format("MMM D, YYYY"),
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="paidFeesUSD"
                  fill="url(#paidFeesUSD)"
                  stroke="var(--color-paidFeesUSD)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </GradientBorderCard>
        </div>
        <div className="flex items-center gap-2">
          <div className="font-semibold">All Operators</div>
          <div className="bg-accent-purple text-primary-foreground rounded-full px-2 py-1 text-xs font-bold">
            {table.getRowCount()}
          </div>
          <div className="flex-1" />
          <div className="relative md:w-[330px]">
            <Input
              className="h-9 pl-10"
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              placeholder="Enter Operator Name"
            />
            <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
                        return
                      }
                      table.setColumnFilters([
                        { id: "name", value: item.value },
                      ])
                    }}
                  >
                    {item.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/profile">
            <Button variant="purple" size="sm">
              Manage your staking
            </Button>
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
            {!fullOperators ? (
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
