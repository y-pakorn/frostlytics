import { ComponentProps } from "react"
import Link from "next/link"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { images } from "@/config/image"
import { links } from "@/config/link"
import { cn } from "@/lib/utils"

import { Icons } from "./icons"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export const OperatorHeader = ({
  operator,
  className,
  ...props
}: {
  operator: OperatorWithSharesAndBaseApy
} & ComponentProps<"div">) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn("flex w-[250px] items-center gap-2", className)}
          {...props}
        >
          {operator.metadata?.imageUrl ? (
            <img
              src={operator.metadata.imageUrl}
              alt={operator.name}
              className="size-8 shrink-0 rounded-full"
              onError={(e) => (e.currentTarget.src = images.avatar)}
            />
          ) : (
            <Icons.avatar className="size-8 shrink-0 rounded-full" />
          )}
          <div className="min-w-0">
            <div className="flex items-center justify-start gap-1 overflow-hidden font-medium">
              <div className="truncate">{operator.name}</div>
              {!operator.isCommittee && (
                <Badge variant="outline" size="sm" className="shrink-0">
                  Not Committee
                </Badge>
              )}
            </div>
            <div className="text-tertiary flex items-center gap-1 font-mono text-xs">
              {operator.id.slice(0, 8)}...{operator.id.slice(-8)}{" "}
              <Button
                size="iconXs"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(operator.id)
                  toast.success("Copied to clipboard")
                }}
              >
                <Copy />
              </Button>
              <Link href={links.object(operator.id)} target="_blank">
                <Button variant="ghost" size="iconXs">
                  <ExternalLink />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[250px] space-y-2">
        <div className="flex items-center gap-2">
          {operator.metadata?.imageUrl ? (
            <img
              src={operator.metadata.imageUrl}
              alt={operator.name}
              className="size-6 shrink-0 rounded-full"
              onError={(e) => (e.currentTarget.src = images.avatar)}
            />
          ) : (
            <Icons.avatar className="size-6 shrink-0 rounded-full" />
          )}
          <div className="min-w-0">
            <div className="line-clamp-1 truncate font-medium">
              {operator.name}
            </div>
            <div className="text-tertiary font-mono text-xs">
              {operator.id.slice(0, 8)}...{operator.id.slice(-8)}
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
          <div className="text-tertiary font-bold">Description</div>
          <div className="text-secondary">
            {operator.metadata?.description || "-"}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
