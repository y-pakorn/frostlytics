import Link from "next/link"
import { ArrowLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function OperatorBreadcrumbs({
  operatorName,
}: {
  operatorName?: string
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <Button variant="outline" size="sm" className="rounded-full" asChild>
        <Link href="/operator">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>
      <Link
        href="/operator"
        className="text-secondary-foreground hover:text-foreground font-medium transition-colors"
      >
        Operators
      </Link>
      <ChevronRight className="text-tertiary size-4 shrink-0" />
      <span className="text-foreground max-w-[200px] truncate font-semibold sm:max-w-none">
        {operatorName ?? "Operator"}
      </span>
    </nav>
  )
}
