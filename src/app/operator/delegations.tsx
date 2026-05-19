import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import range from "lodash/range"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { MinimalOperatorWithMetadata } from "@/types/operator"
import { links } from "@/config/link"
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
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
import { PaginationManual } from "@/components/pagination"
import { useDelegations } from "@/hooks"
import { DelegationResponse } from "@/types"

import { DelegationRowCard } from "./_components/delegation-row-card"

const TABLE_HEAD_CLASS =
  "h-11 border-0 bg-[rgba(50,40,84,0.9)] px-6 py-3 text-xs font-semibold tracking-normal text-foreground normal-case shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"

const TABLE_CELL_CLASS =
  "h-16 border-border-secondary/40 border-b px-6 py-3 first:pl-6 last:pr-6"

const columns = [
  {
    header: "Address",
    id: "address",
    accessorFn: (row) => row[0],
    cell: ({ row }) => {
      const address = row.original[0]
      const name = row.original[6]
      return (
        <Link href={`/profile?addr=${address}`} prefetch={false}>
          {name && <div className="font-medium">{name}</div>}
          <div className="text-tertiary flex items-center gap-1 font-mono text-xs">
            {address.slice(0, 8)}...{address.slice(-8)}
            <Button
              variant="ghost"
              size="iconXs"
              onClick={(e) => {
                e.preventDefault()
                navigator.clipboard.writeText(address)
                toast.success("Copied to clipboard")
              }}
            >
              <Copy />
            </Button>
            <Button
              variant="ghost"
              size="iconXs"
              onClick={(e) => {
                e.preventDefault()
                window.open(links.account(address), "_blank")
              }}
            >
              <ExternalLink />
            </Button>
          </div>
        </Link>
      )
    },
  },
  {
    header: "Operation",
    id: "operation",
    accessorFn: (row) => row[4],
    cell: ({ getValue }) => {
      const operation = getValue<"Staked" | "Withdrawing" | (string & {})>()
      return (
        <Badge
          variant={
            operation === "Staked"
              ? "success"
              : operation === "Withdrawing"
                ? "accentPurpleOutline"
                : "outline"
          }
        >
          {operation}
        </Badge>
      )
    },
  },
  {
    header: () => <div className="ml-auto text-end">Amount</div>,
    id: "amount",
    accessorFn: (row) => row[1],
    cell: ({ getValue }) => (
      <div className="text-secondary-foreground text-end font-medium">
        {formatter.number(getValue<number>())} WAL
      </div>
    ),
  },
  {
    header: () => <div className="ml-auto text-end">Epoch</div>,
    id: "activationEpoch",
    accessorFn: (row) => row[2],
    cell: ({ getValue }) => (
      <div className="text-end">
        <span className="bg-surface-elevated/60 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-xs font-medium">
          {getValue<number>()}
        </span>
      </div>
    ),
  },
  {
    header: () => <div className="ml-auto text-end">Age</div>,
    id: "age",
    accessorFn: (row) => row[3],
    cell: ({ getValue }) => (
      <div className="text-secondary-foreground text-end">
        {dayjs(getValue<number>()).fromNow(true)}
      </div>
    ),
  },
  {
    header: () => <div className="ml-auto text-end">Digest</div>,
    id: "digest",
    accessorFn: (row) => row[5],
    cell: ({ getValue }) => {
      const digest = getValue<string>()
      return (
        <div className="text-end">
          <Link href={links.transaction(digest)} target="_blank">
            <Button variant="ghost" size="iconXs" className="text-tertiary">
              <ExternalLink />
            </Button>
          </Link>
        </div>
      )
    },
  },
] satisfies ColumnDef<DelegationResponse["delegations"][number]>[]

export function OperatorDelegations({
  operator,
  searchQuery = "",
}: {
  operator: MinimalOperatorWithMetadata
  searchQuery?: string
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { data: delegations, isPending } = useDelegations({
    pageIndex,
    operatorId: operator.id,
  })
  useEffect(() => {
    if (delegations) setTotalPages(delegations.totalPages)
  }, [delegations])

  const data = useMemo(() => {
    const rows = delegations?.delegations ?? []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(([address, , , , , , name]) => {
      return (
        address.toLowerCase().includes(q) ||
        (name?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [delegations, searchQuery])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-3">
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
                    const isFirst = index === 0
                    const isLast = index === headerGroup.headers.length - 1
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          TABLE_HEAD_CLASS,
                          isFirst && "rounded-l-full",
                          isLast && "rounded-r-full",
                          !isFirst && header.id !== "address" && "text-end"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isPending ? (
                range(10).map((i) => (
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
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-0 hover:bg-surface-elevated/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={TABLE_CELL_CLASS}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
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

      <div className="block space-y-2 md:hidden">
        {isPending
          ? range(8).map((i) => (
              <Skeleton
                key={i}
                className="h-[140px] w-full rounded-[var(--glass-card-radius)]"
              />
            ))
          : table.getRowModel().rows.length
            ? table.getRowModel().rows.map((row) => (
                <DelegationRowCard key={row.id} row={row.original} />
              ))
            : (
                <div className="text-tertiary py-8 text-center text-sm">
                  No results.
                </div>
              )}
      </div>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-tertiary text-sm font-medium">
          Delegation data is provided by{" "}
          <Link href={links.blockberry} target="_blank" className="underline">
            Blockberry
          </Link>
        </div>
        {totalPages > 1 ? (
          <PaginationManual
            totalPages={totalPages}
            currentPageIndex={pageIndex}
            setPageIndex={setPageIndex}
            className="hidden md:flex"
          />
        ) : null}
      </div>
    </div>
  )
}
