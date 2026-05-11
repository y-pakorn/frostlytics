"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Timerange = "7d" | "30d" | "90d" | "all"

export const TIMERANGE_DAYS: Record<Timerange, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
}

const OPTIONS: { value: Timerange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
]

export function TimerangePicker({
  value,
  onChange,
  className,
}: {
  value: Timerange
  onChange: (v: Timerange) => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "active" : "inactive"}
          size="sm"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}

// Filter a daily-keyed (timestamp) array down to the selected range.
export const filterByRange = <T extends { timestamp: string }>(
  rows: T[],
  range: Timerange
): T[] => {
  const days = TIMERANGE_DAYS[range]
  if (days == null) return rows
  const cutoff = Date.now() - days * 86_400_000
  return rows.filter((r) => new Date(r.timestamp).getTime() >= cutoff)
}
