import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import _ from "lodash"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { MinimalOperatorWithMetadata } from "@/types/operator"
import { links } from "@/config/link"
import { walrus } from "@/config/walrus"
import { Button } from "@/components/ui/button"
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
          <div className="font-xs text-tertiary font-mono">{label}</div>
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
        <Link href={`/profile/${address}`} prefetch={false}>
          {name && <div className="font-medium">{name}</div>}
          <div className="text-tertiary flex items-center gap-1 font-mono">
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
    header: "Txs",
    id: "txCount",
    accessorKey: "txCount",
    cell: ({ getValue }) => {
      const txCount = getValue<number>()
      return <div className="text-secondary">{txCount}</div>
    },
  },
  {
    header: "Gas",
    id: "gas",
    accessorKey: "gas",
    cell: ({ getValue }) => {
      const gas = getValue<number>()
      const gasSui = gas / walrus.denominator
      return (
        <div>
          <div className="text-secondary">{gasSui} SUI</div>
          <div className="font-xs text-tertiary">{gas} FROST</div>
        </div>
      )
    },
  },
  {
    header: "Digest",
    id: "digest",
    accessorFn: (row) => row.digest,
    cell: ({ getValue }) => {
      const digest = getValue<string>()
      return (
        <Link href={links.transaction(digest)} target="_blank">
          <Button variant="ghost" size="iconXs" className="text-tertiary">
            <ExternalLink />
          </Button>
        </Link>
      )
    },
  },
] satisfies ColumnDef<OperatorTransaction>[]

export function OperatorTransactions({
  operator,
}: {
  operator: MinimalOperatorWithMetadata
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
    return transactions?.pages[pageIndex]?.transactions ?? []
  }, [transactions, pageIndex])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
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
            _.range(20).map((i) => (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PaginationLeftRight
        currentPageIndex={pageIndex}
        onPrev={() => setPageIndex((p) => p - 1)}
        onNext={() => {
          // fetch next page if is at the last page and has next page
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
