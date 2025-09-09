"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useResolveSuiNSName } from "@mysten/dapp-kit"
import { bcs } from "@mysten/sui/bcs"
import { Transaction } from "@mysten/sui/transactions"
import { useQuery } from "@tanstack/react-query"
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
import BigNumber from "bignumber.js"
import { blo } from "blo"
import _ from "lodash"
import {
  ArrowUpRight,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Gem,
  PackageCheck,
  Search,
  Share,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { walrus } from "@/config/walrus"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useBalances } from "@/hooks/use-balances"
import { suiClient } from "@/services/client"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { GradientBorderCard } from "@/components/gradient-border-card"
import { OperatorHeader } from "@/components/operator-header"
import { UnstakeDialog } from "@/components/unstake-dialog"
import { WithdrawDialog } from "@/components/withdraw-dialog"
import {
  useEstimatedReward,
  useFullOperators,
  useStakedWalWithStatus,
} from "@/hooks"
import { StakedWalWithStatus } from "@/types"

export function Profile({
  address,
  readOnly = false,
}: {
  address: string
  readOnly?: boolean
}) {
  const { data: name } = useResolveSuiNSName(address)

  const stakedWalWithStatus = useStakedWalWithStatus({
    address,
  })

  const validators = useFullOperators()
  const validatorMap = useMemo(() => {
    return _.keyBy(validators, "id")
  }, [validators])

  const { walBalance } = useBalances({ address })
  const totalStakedBalance = useMemo(() => {
    return _.sumBy(stakedWalWithStatus, "amount")
  }, [stakedWalWithStatus])

  const estimatedReward = useEstimatedReward({
    address,
    stakedWals: stakedWalWithStatus,
  })

  const columns = useMemo(() => {
    return [
      {
        header: "Name/ID",
        accessorFn: (stakedWal) =>
          validatorMap[stakedWal.nodeId]?.name || stakedWal.nodeId,
        enableSorting: false,
        enableGlobalFilter: true,
        cell: ({ row }) =>
          validatorMap[row.original.nodeId] ? (
            <OperatorHeader operator={validatorMap[row.original.nodeId]} />
          ) : (
            <Skeleton className="h-3/4 w-full" />
          ),
      },
      {
        header: "Position ID",
        accessorKey: "status",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="text-tertiary font-mono font-medium">
                  {row.original.id.slice(0, 8)}...{row.original.id.slice(-8)}
                </div>
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={() => {
                    navigator.clipboard.writeText(row.original.id)
                    toast.success("Copied to clipboard")
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
              <Badge
                variant={
                  row.original.status === "staked"
                    ? "success"
                    : row.original.status === "claimable"
                      ? "accentPurpleOutline"
                      : "outline"
                }
              >
                {_.startCase(row.original.status)}
              </Badge>
            </div>
          )
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        enableSorting: true,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          return (
            <div className="font-bold">
              {formatter.number(row.original.amount)} WAL
            </div>
          )
        },
      },
      {
        header: "Activation Epoch",
        accessorKey: "activationEpoch",
        enableSorting: true,
        sortDescFirst: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          return (
            <div className="text-tertiary font-semibold">
              Epoch {row.original.activationEpoch}
            </div>
          )
        },
      },
      ...(readOnly
        ? []
        : ([
            {
              header: "Action",
              accessorKey: "action",
              enableSorting: false,
              enableGlobalFilter: false,
              cell: ({ row }) => {
                const thisEstimatedReward =
                  estimatedReward.data?.rewards[row.original.id] || 0
                if (row.original.status === "withdrawing") {
                  return (
                    <div className="text-disabled font-semibold">
                      Withdrawing Epoch {row.original.withdrawEpoch}
                    </div>
                  )
                }
                if (row.original.canWithdrawRightNow) {
                  return (
                    <WithdrawDialog
                      stakedWal={[row.original]}
                      estimatedReward={thisEstimatedReward}
                    >
                      <Button variant="errorSecondary" size="sm">
                        Withdraw
                      </Button>
                    </WithdrawDialog>
                  )
                }
                return (
                  <UnstakeDialog
                    stakedWal={row.original}
                    operator={validatorMap[row.original.nodeId] || null}
                    estimatedReward={thisEstimatedReward}
                  >
                    <Button variant="purpleSecondary" size="sm">
                      Unstake
                    </Button>
                  </UnstakeDialog>
                )
              },
            },
          ] satisfies ColumnDef<StakedWalWithStatus>[])),
    ] satisfies ColumnDef<StakedWalWithStatus>[]
  }, [validatorMap, estimatedReward])

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "amount",
      desc: true,
    },
  ])
  const [globalFilter, setGlobalFilter] = useState<any>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: stakedWalWithStatus || [],
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
  })

  return (
    <div className="space-y-6">
      <GradientBorderCard>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img
              src={blo(address as any)}
              className="size-12 shrink-0 rounded-full"
            />
            <div className="break-all">
              <h1 className="text-foreground line-clamp-1 text-2xl font-medium">
                {name || `${address.slice(0, 6)}...${address.slice(-4)}`}
              </h1>
              <div className="flex items-center gap-1">
                <p className="line-clamp-1 font-mono text-sm">
                  {address.slice(0, 10)}...{address.slice(-10)}
                </p>
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={() => {
                    navigator.clipboard.writeText(address)
                    toast.success("Address copied to clipboard")
                  }}
                >
                  <Copy />
                </Button>
                <Link href={links.account(address)} target="_blank">
                  <Button variant="ghost" size="iconXs">
                    <ExternalLink />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/profile/${address}`
                )
                toast.success("Link copied to clipboard")
              }}
            >
              Share Address <Share />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: Wallet,
                label: "WAL Balance",
                isLoading: walBalance.isPending,
                value: formatter.number(walBalance.data || 0),
              },
              {
                icon: PackageCheck,
                label: "Staked WAL",
                isLoading: stakedWalWithStatus === null,
                value: formatter.number(totalStakedBalance),
              },
              {
                icon: Gem,
                label: "Estimated Reward",
                isLoading: estimatedReward.isPending,
                value: formatter.number(estimatedReward.data?.total || 0, 4),
              },
            ].map(({ icon: Icon, label, value, isLoading }) => (
              <div
                key={label}
                className="flex w-full gap-3 rounded-lg bg-black/20 p-4 shadow-xs"
              >
                <div
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon",
                    className: "rounded-md",
                  })}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <h3>{label}</h3>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <p className="text-foreground text-xl font-medium">
                      {value} WAL
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </GradientBorderCard>
      <div className="bg-accent-purple-light text-primary flex h-9 w-fit items-center gap-1 rounded-full px-3 text-sm font-semibold">
        Staking
        <div className="bg-accent-purple-deep! text-foreground flex size-5.5 items-center justify-center rounded-full text-center text-xs tracking-tight">
          <div className="mt-0.5">{stakedWalWithStatus?.length || 0}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {[
          {
            label: "All",
            status: undefined,
          },
          {
            label: "Staking",
            status: "staked",
          },
          {
            label: "Withdrawing",
            status: "withdrawing",
          },
          {
            label: "Claimable",
            status: "claimable",
          },
        ].map(({ label, status }) => {
          const isSelected = columnFilters[0]?.value === status
          return (
            <Button
              key={label}
              size="sm"
              variant={isSelected ? "default" : "ghost"}
              onClick={() => {
                if (status === undefined) {
                  setColumnFilters([])
                  return
                }
                setColumnFilters([
                  {
                    id: "status",
                    value: status,
                  },
                ])
              }}
            >
              {label}{" "}
              <div className="bg-accent flex size-5.5 items-center justify-center rounded-full border text-sm">
                {_.sumBy(stakedWalWithStatus, (s) =>
                  !status || s.status === status ? 1 : 0
                )}
              </div>
            </Button>
          )
        })}
        <div className="flex-1" />
        <div className="relative md:w-[330px]">
          <Input
            placeholder="Enter Operator Name"
            className="pl-10"
            onChange={(e) => table.setGlobalFilter(e.target.value)}
          />
          <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        </div>
        <WithdrawDialog
          stakedWal={
            stakedWalWithStatus?.filter((s) => s.canWithdrawRightNow) || []
          }
          estimatedReward={_.sumBy(
            stakedWalWithStatus?.filter((s) => s.canWithdrawRightNow) || [],
            (s) => estimatedReward.data?.rewards[s.id] || 0
          )}
          isWithdrawAll
        >
          <Button
            variant="purple"
            size="sm"
            disabled={
              !stakedWalWithStatus?.filter((s) => s.canWithdrawRightNow).length
            }
          >
            Withdraw All
          </Button>
        </WithdrawDialog>
      </div>
      {stakedWalWithStatus?.length !== 0 ? (
        <Table className="flex-1">
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
            {!stakedWalWithStatus
              ? _.range(10).map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-3/4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : table.getRowModel().rows?.map((row) => (
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
                ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-disabled flex h-[320px] flex-col items-center justify-center space-y-2.5 text-center font-medium">
          <div>
            No staked validators yet.
            <br />
            Get started by finding a Operator to stake with
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              Find Operators <ArrowUpRight />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
