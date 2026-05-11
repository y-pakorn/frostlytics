import { Inbox } from "lucide-react"

export function EmptyChartState({
  message = "Insufficient data",
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={
        "text-secondary-foreground flex h-full flex-col items-center justify-center gap-2 text-xs " +
        (className ?? "")
      }
    >
      <Inbox className="size-5 opacity-50" />
      <span>{message}</span>
    </div>
  )
}
