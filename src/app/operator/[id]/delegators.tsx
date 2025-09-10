import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import _ from "lodash"
import { ChevronDown, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { MinimalOperatorWithMetadata } from "@/types/operator"
import { links } from "@/config/link"
import { formatter } from "@/lib/formatter"
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
import { PaginationManual } from "@/components/pagination"
import { useDelegators } from "@/hooks"
import { DelegatorResponse } from "@/types"

const columns = [
  {
    header: "Address",
    id: "address",
    accessorFn: (row) => row[0],
    cell: ({ row }) => {
      const address = row.original[0]
      const name = row.original[3]
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
    header: () => (
      <div className="flex items-center gap-1">
        Amount <ChevronDown className="size-4" />
      </div>
    ),
    id: "amount",
    accessorFn: (row) => row[1],
    cell: ({ getValue }) => {
      const amount = getValue<number>()
      return (
        <div className="text-secondary">{formatter.number(amount)} WAL</div>
      )
    },
  },
  {
    header: "Activation Epoch",
    id: "activationEpoch",
    accessorFn: (row) => row[2],
    cell: ({ getValue }) => {
      const activationEpoch = getValue<number>()
      return <div className="text-secondary">{activationEpoch}</div>
    },
  },
] satisfies ColumnDef<DelegatorResponse["delegators"][number]>[]

export function OperatorDelegators({
  operator,
}: {
  operator: MinimalOperatorWithMetadata
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { data: delegators, isPending } = useDelegators({
    pageIndex,
    operatorId: operator.id,
  })
  useEffect(() => {
    if (delegators) setTotalPages(delegators.totalPages)
  }, [delegators])

  const table = useReactTable({
    data: delegators?.delegators || [],
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
          {isPending ? (
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
      <PaginationManual
        totalPages={totalPages}
        currentPageIndex={pageIndex}
        setPageIndex={setPageIndex}
      />
    </div>
  )
}
