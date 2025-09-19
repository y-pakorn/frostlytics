"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import _ from "lodash"
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Copy,
  Search,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import { toast } from "sonner"
import z from "zod"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { images } from "@/config/image"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { cn, getPaginationPages } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GradientBorderCard } from "@/components/gradient-border-card"
import { Icons } from "@/components/icons"
import { Pagination } from "@/components/pagination"
import { useFullOperators } from "@/hooks"

const MAIN_SECTION_WIDTH = "383px"

const rewardFormSchema = z.object({
  amount: z.coerce.number().gt(0, "Staking amount must be greater than 0"),
  day: z.coerce.number().gt(0, "Staking period must be greater than 0"),
})

type OperatorWithReward = OperatorWithSharesAndBaseApy & {
  reward: number
}

export default function RewardCalculator() {
  const fullOperators = useFullOperators()

  const form = useForm<z.infer<typeof rewardFormSchema>>({
    resolver: zodResolver(rewardFormSchema),
  })

  const [operatorRewards, setOperatorRewards] = useState<Record<
    string,
    OperatorWithReward
  > | null>(null)

  const onSubmit = ({ amount, day }: z.infer<typeof rewardFormSchema>) => {
    const operators =
      fullOperators?.map((o) => ({
        ...o,
        // Compound reward calculation for each operator
        // reward = final amount - initial amount, compounded weekly
        reward:
          amount * Math.pow(1 + o.apyWithCommission / 52, 52 * (day / 365)) -
          amount,
      })) || []
    setOperatorRewards(_.keyBy(operators, "id"))
    track("CalculateReward", { amount, day })
  }

  const columns = useMemo(
    () =>
      [
        {
          header: "Name/ID",
          accessorKey: "name",
          enableSorting: false,
          filterFn: "isCommittee" as any,
          cell: ({ row }) => {
            const operator = row.original
            const metadata = operator.metadata
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex w-[250px] items-center gap-2">
                    {metadata?.imageUrl ? (
                      <img
                        src={metadata.imageUrl}
                        alt={operator.name}
                        className="size-8 shrink-0 rounded-full"
                        onError={(e) => (e.currentTarget.src = images.avatar)}
                      />
                    ) : (
                      <Icons.avatar className="size-8 shrink-0 rounded-full" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center justify-start gap-1 overflow-hidden font-medium">
                        <div className="truncate">{operator.name}</div>
                        {!operator.isCommittee && (
                          <Badge
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                          >
                            Not Committee
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
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px] space-y-2">
                  <div className="flex items-center gap-2">
                    {metadata?.imageUrl ? (
                      <img
                        src={metadata.imageUrl}
                        alt={operator.name}
                        className="size-6 shrink-0 rounded-full"
                      />
                    ) : (
                      <Icons.avatar className="size-6 shrink-0 rounded-full" />
                    )}
                    <div className="min-w-0">
                      <div className="line-clamp-1 truncate font-medium">
                        {operator.name}
                      </div>
                      <div className="text-tertiary font-mono text-xs">
                        {operator.id.slice(0, 8)}...{operator.id.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-tertiary font-bold">Description</div>
                    <div className="text-secondary">
                      {metadata?.description || "-"}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
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
          id: "reward",
          header: "Estimated Reward",
          accessorKey: "reward",
          enableSorting: true,
          cell: ({ row }) => {
            const reward = operatorRewards?.[row.original.id]?.reward
            if (!reward) return <div className="text-tertiary">-</div>
            return (
              <div className="font-bold">{formatter.number(reward, 4)} WAL</div>
            )
          },
        },
      ] satisfies ColumnDef<OperatorWithSharesAndBaseApy>[],
    [operatorRewards]
  )

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "apyWithCommission",
      desc: true,
    },
  ])
  const [globalFilter, setGlobalFilter] = useState<any>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const data = useMemo(() => {
    return fullOperators || []
  }, [fullOperators])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
    },
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-accent-purple-light text-4xl font-semibold">
          Reward Calculator
        </h1>
        <p className="font-medium">
          Estimate your potential rewards based on staking amount and staking
          period
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex max-w-full min-w-0 items-end gap-2"
        >
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel asterisk>Staking Amount</FormLabel>
                <FormControl>
                  <NumericFormat
                    {...field}
                    customInput={Input}
                    placeholder="Enter staking amount"
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
              <FormItem>
                <FormLabel asterisk>Staking Period (Days)</FormLabel>
                <FormControl>
                  <NumericFormat
                    {...field}
                    customInput={Input}
                    placeholder="Enter staking period"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => form.setValue("day", 30)}
          >
            30D
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => form.setValue("day", 365)}
          >
            365D
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => form.setValue("day", 730)}
          >
            730D
          </Button>
          <Button
            type="submit"
            variant="purple"
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            Calculate
          </Button>
        </form>
      </Form>
      <div className="space-y-2">
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
        </div>
        <div className="w-full overflow-x-auto">
          <Table>
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
                    className="text-disabled h-[350px] text-center"
                  >
                    No matched operators found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination table={table} />
      </div>
    </div>
  )
}
