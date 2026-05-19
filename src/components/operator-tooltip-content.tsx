import { OperatorWithSharesAndBaseApy } from "@/types/operator"

import { SafeImage } from "./safe-image"
import { Separator } from "./ui/separator"

export function OperatorTooltipContent({
  operator,
}: {
  operator: OperatorWithSharesAndBaseApy
}) {
  const description =
    operator.metadata?.description?.trim() || "No description available."

  return (
    <>
      <div className="flex items-center gap-2.5">
        <SafeImage
          src={operator.metadata?.imageUrl}
          alt={operator.name}
          className="size-8 shrink-0 rounded-full border border-white/10"
        />
        <div className="min-w-0">
          <div className="text-foreground truncate text-sm font-semibold">
            {operator.name}
          </div>
          <div className="text-tertiary font-mono text-xs">
            {operator.id.slice(0, 8)}...{operator.id.slice(-8)}
          </div>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="space-y-1.5">
        <div className="text-tertiary text-xs font-bold tracking-wide uppercase">
          Description
        </div>
        <p className="text-secondary-foreground text-xs font-normal">
          {description}
        </p>
      </div>
    </>
  )
}
