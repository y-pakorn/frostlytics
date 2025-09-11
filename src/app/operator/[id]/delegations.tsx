import { useEffect, useMemo, useState } from "react"
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
import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"
import { Badge } from "@/components/ui/badge"
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
import { useDelegations } from "@/hooks"
import { DelegationResponse } from "@/types"

const columns = [
  {
    header: "Address",
    id: "address",
    accessorFn: (row) => row[0],
    cell: ({ row }) => {
      const address = row.original[0]
      const name = row.original[6]
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
    header: "Amount",
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
    header: "Epoch",
    id: "activationEpoch",
    accessorFn: (row) => row[2],
    cell: ({ getValue }) => {
      const activationEpoch = getValue<number>()
      return <div className="text-secondary">{activationEpoch}</div>
    },
  },
  {
    header: "Age",
    id: "age",
    accessorFn: (row) => row[3],
    cell: ({ getValue }) => {
      const age = getValue<number>()
      return <div className="text-secondary">{dayjs(age).fromNow(true)}</div>
    },
  },
  {
    header: "Digest",
    id: "digest",
    accessorFn: (row) => row[5],
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
] satisfies ColumnDef<DelegationResponse["delegations"][number]>[]

export function OperatorDelegations({
  operator,
}: {
  operator: MinimalOperatorWithMetadata
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
    return delegations?.delegations ?? []
  }, [delegations])
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
