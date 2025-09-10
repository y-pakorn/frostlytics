import { ComponentProps } from "react"
import { Table } from "@tanstack/react-table"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn, getPaginationPages } from "@/lib/utils"

import { Button } from "./ui/button"

export function Pagination<T>({
  table,
  className,
  buttonProps: { className: buttonClassName, ...buttonProps } = {},
  ...props
}: {
  table: Table<T>
  buttonProps?: ComponentProps<typeof Button>
} & ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center justify-end", className)} {...props}>
      <Button
        variant="outlineTransparent"
        size="icon"
        className={cn("rounded-none rounded-l-md border-r-0", buttonClassName)}
        onClick={() => table.setPageIndex(0)}
        disabled={table.getState().pagination.pageIndex === 0}
        {...buttonProps}
      >
        <ArrowLeft />
      </Button>
      {getPaginationPages(
        table.getPageCount(),
        table.getState().pagination.pageIndex
      ).map((page, i) => (
        <Button
          key={i}
          variant={
            page === table.getState().pagination.pageIndex + 1
              ? "purple"
              : "outlineTransparent"
          }
          size="icon"
          className={cn(
            "rounded-none border-r-0",
            page === null && "pointer-events-none",
            buttonClassName
          )}
          onClick={() => page && table.setPageIndex(page - 1)}
          {...buttonProps}
        >
          {page || "..."}
        </Button>
      ))}
      <Button
        variant="outlineTransparent"
        size="icon"
        className={cn("rounded-none rounded-r-md", buttonClassName)}
        onClick={() => table.setPageIndex((p) => p + 1)}
        disabled={
          table.getState().pagination.pageIndex === table.getPageCount() - 1
        }
      >
        <ArrowRight />
      </Button>
    </div>
  )
}
