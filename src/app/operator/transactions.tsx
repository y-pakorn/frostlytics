import { useMemo, useState } from "react"
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
import { walrus } from "@/config/walrus"
import { TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from "@/lib/glass-table"
import { cn } from "@/lib/utils"
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
import { PaginationLeftRight } from "@/components/pagination"
import { useOperatorTransactions } from "@/hooks"
import { OperatorTransaction } from "@/types"

import { TransactionRowCard } from "./_components/transaction-row-card"

const columns = [
  {
    header: "Transaction",
    id: "transaction",
    accessorKey: "txLabel",
    cell: ({ getValue }) => {
      const label = getValue<string>()
      if (!label) return <div className="text-tertiary">Unknown</div>
      return (
        <div>
          <div className="font-medium">Programmable Tx</div>
          <div className="text-tertiary font-mono text-xs">{label}</div>
        </div>
      )
    },
  },
  {
    header: "Sender",
    id: "sender",
    accessorKey: "sender",
    cell: ({ row }) => {
      const address = row.original.sender
      const name = row.original.name
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
    header: () => <div className="ml-auto text-end">Txs</div>,
    id: "txCount",
    accessorKey: "txCount",
    cell: ({ getValue }) => (
      <div className="text-secondary-foreground text-end">
        {getValue<number>()}
      </div>
    ),
  },
  {
    header: () => <div className="ml-auto text-end">Gas</div>,
    id: "gas",
    accessorKey: "gas",
    cell: ({ getValue }) => {
      const gas = getValue<number>()
      const gasSui = gas / walrus.denominator
      return (
        <div className="text-end">
          <div className="text-secondary-foreground">{gasSui} SUI</div>
          <div className="text-tertiary text-xs">{gas} FROST</div>
        </div>
      )
    },
  },
  {
    header: () => <div className="ml-auto text-end">Digest</div>,
    id: "digest",
    accessorFn: (row) => row.digest,
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
] satisfies ColumnDef<OperatorTransaction>[]

export function OperatorTransactions({
  operator,
  searchQuery = "",
}: {
  operator: MinimalOperatorWithMetadata
  searchQuery?: string
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const {
    data: transactions,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useOperatorTransactions({
    operatorId: operator.id,
  })

  const data = useMemo(() => {
    const rows = transactions?.pages[pageIndex]?.transactions ?? []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (tx) =>
        tx.digest.toLowerCase().includes(q) ||
        tx.sender.toLowerCase().includes(q) ||
        tx.txLabel?.toLowerCase().includes(q)
    )
  }, [transactions, pageIndex, searchQuery])

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
                          !isFirst &&
                            header.id !== "transaction" &&
                            header.id !== "sender" &&
                            "text-end"
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
              {isFetching ? (
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
        {isFetching
          ? range(8).map((i) => (
              <Skeleton
                key={i}
                className="h-[160px] w-full rounded-[var(--glass-card-radius)]"
              />
            ))
          : table.getRowModel().rows.length
            ? table.getRowModel().rows.map((row) => (
                <TransactionRowCard key={row.id} tx={row.original} />
              ))
            : (
                <div className="text-tertiary py-8 text-center text-sm">
                  No results.
                </div>
              )}
      </div>

      <PaginationLeftRight
        className="hidden justify-end md:flex"
        currentPageIndex={pageIndex}
        onPrev={() => setPageIndex((p) => p - 1)}
        onNext={() => {
          if (
            transactions &&
            pageIndex === transactions.pages.length - 1 &&
            hasNextPage
          ) {
            fetchNextPage().then(() => {
              setPageIndex((p) => p + 1)
            })
          } else {
            setPageIndex((p) => p + 1)
          }
        }}
        canPrev={pageIndex > 0}
        canNext={
          !!transactions &&
          (pageIndex < transactions?.pages.length - 1 || hasNextPage)
        }
      />
    </div>
  )
}
