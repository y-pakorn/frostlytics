"use client"

import { useCallback, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
import debounce from "lodash/debounce"
import keyBy from "lodash/keyBy"
import range from "lodash/range"
import { ChevronDown, ChevronsUpDown, ChevronUp, Search } from "lucide-react"
import { useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import z from "zod"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { OperatorHeader } from "@/components/operator-header"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { useFullOperators } from "@/hooks"

import { OperatorRewardRowCard } from "./_components/operator-reward-row-card"

const rewardFormSchema = z.object({
  amount: z.coerce.number().gt(0, "Staking amount must be greater than 0"),
  day: z.coerce.number().gt(0, "Staking period must be greater than 0"),
})

const operatorTypeFilters = [
  { label: "All Operators", value: "all" as const },
  { label: "Committee", value: true },
  { label: "Not-Committee", value: false },
] as const

const PERIOD_PRESETS = [30, 365, 730] as const

const TABLE_HEAD_CLASS =
  "h-11 border-0 bg-[rgba(50,40,84,0.9)] px-6 py-3 text-xs font-semibold tracking-normal text-foreground normal-case shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"

const TABLE_CELL_CLASS =
  "h-16 border-border-secondary/40 border-b px-6 py-3 first:pl-6 last:pr-6"

type OperatorWithReward = OperatorWithSharesAndBaseApy & {
  reward: number
}

export default function RewardCalculator() {
  const fullOperators = useFullOperators()

  const form = useForm<
    z.input<typeof rewardFormSchema>,
    any,
    z.output<typeof rewardFormSchema>
  >({
    resolver: zodResolver(rewardFormSchema),
    mode: "onChange",
  })

  const [operatorRewards, setOperatorRewards] = useState<Record<
    string,
    OperatorWithReward
  > | null>(null)

  const amount = form.watch("amount")
  const day = form.watch("day")
  const canCalculate = useMemo(() => {
    return rewardFormSchema.safeParse({ amount, day }).success
  }, [amount, day])

  const onSubmit = ({ amount, day }: z.output<typeof rewardFormSchema>) => {
    const operators =
      fullOperators?.map((o) => ({
        ...o,
        reward:
          amount * Math.pow(1 + o.apyWithCommission / 52, 52 * (day / 365)) -
          amount,
      })) || []
    setOperatorRewards(keyBy(operators, "id"))
    track("CalculateReward", { amount, day })
  }

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
          id: "reward",
          header: () => (
            <div className="ml-auto text-end">Estimated Reward</div>
          ),
          accessorFn: (row) => operatorRewards?.[row.id]?.reward,
          enableSorting: true,
          sortUndefined: "last",
          cell: ({ row }) => {
            const reward = operatorRewards?.[row.original.id]?.reward
            if (!reward) return <div className="text-tertiary text-end">-</div>
            return (
              <div className="text-brand-300 text-end text-sm font-semibold">
                {formatter.number(reward, 4)} WAL
              </div>
            )
          },
        },
      ] satisfies ColumnDef<OperatorWithSharesAndBaseApy>[],
    [operatorRewards]
  )

  const trackSearch = useCallback(
    debounce((query: string) => {
      if (query) track("TableSearch", { table: "operators", query })
    }, 500),
    []
  )

  const [sorting, setSorting] = useState<SortingState>([
    { id: "apyWithCommission", desc: true },
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
        Reward Calculator
      </h1>

      <GlassCard
        tone="chart"
        className="rounded-3xl"
        contentClassName="p-4 md:p-5"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="min-w-0 flex-1">
                  <FormLabel asterisk className="text-secondary-foreground">
                    Amount
                  </FormLabel>
                  <FormControl>
                    <NumericFormat
                      {...field}
                      value={field.value as number | undefined}
                      customInput={GlassInput}
                      placeholder="Enter staking amount ($WAL)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem className="min-w-0 flex-1">
                  <FormLabel asterisk className="text-secondary-foreground">
                    Staking Period (Days)
                  </FormLabel>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <FormControl>
                      <NumericFormat
                        {...field}
                        value={field.value as number | undefined}
                        customInput={GlassInput}
                        placeholder="Enter staking period"
                        containerClassName="sm:min-w-[180px]"
                      />
                    </FormControl>
                    <div className="flex gap-1">
                      {PERIOD_PRESETS.map((days) => (
                        <GlassPill
                          key={days}
                          type="button"
                          contentClassName="px-3 font-semibold text-secondary-foreground"
                          onClick={() => {
                            form.setValue("day", days, { shouldValidate: true })
                            track("CalculatorPresetClick", { days })
                          }}
                        >
                          {days}d
                        </GlassPill>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!canCalculate || form.formState.isSubmitting}
              className="h-10 w-full shrink-0 rounded-full md:w-[140px]"
            >
              Calculate
            </Button>
          </form>
        </Form>
      </GlassCard>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-foreground text-base font-semibold">
              All Operators
            </p>
            <Badge variant="epoch">
              {table.getFilteredRowModel().rows.length}
            </Badge>
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
                  contentClassName="gap-1 font-semibold text-secondary-foreground"
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
                  : table.getRowModel().rows?.length
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
                            className={cn(
                              TABLE_CELL_CLASS,
                              "h-24 text-center"
                            )}
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
            ? range(5).map((i) => (
                <Skeleton
                  key={i}
                  className="h-[220px] w-full rounded-[var(--glass-card-radius)]"
                />
              ))
            : table.getFilteredRowModel().rows.length
              ? table.getFilteredRowModel().rows.map((row) => (
                  <OperatorRewardRowCard
                    key={row.id}
                    operator={row.original}
                    reward={operatorRewards?.[row.original.id]?.reward}
                  />
                ))
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
