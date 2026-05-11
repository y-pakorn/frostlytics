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
    <div className="border-accent-purple flex items-center gap-2 border-l-2 pl-3">
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${title}`}
            className="text-secondary-foreground hover:text-foreground transition-colors"
          >
            <Info className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[min(280px,calc(100vw-2rem))] text-left">
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
