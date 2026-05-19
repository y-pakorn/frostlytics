import { Info } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-heading text-foreground text-xl font-bold tracking-[-0.01em]">
        {title}
      </h2>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${title}`}
            className="text-tertiary hover:text-foreground transition-colors"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[min(280px,calc(100vw-2rem))] text-left">
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
