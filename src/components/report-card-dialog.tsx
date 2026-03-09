import { ComponentProps, ReactInstance, useRef } from "react"
import { blo } from "blo"
import { toPng } from "html-to-image"
import { Copy, Save } from "lucide-react"

import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"

import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"

export function ReportCardDialog({
  children,
  imageUrl,
  address,
  stakingPeriod,
  ...props
}: ComponentProps<typeof DialogTrigger> & {
  imageUrl: string
  address: string
  stakingPeriod: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onDownload = async () => {
    if (ref.current === null) return
    const dataUrl = await toPng(ref.current, {
      quality: 1,
      pixelRatio: 1.5,
    })
    const link = document.createElement("a")
    link.download = "component.png"
    link.href = dataUrl
    link.click()
    track("ReportCardSave", { address })
  }
  const onCopy = () => {
    if (!ref.current) return
    track("ReportCardCopy", { address })
  }
  return (
    <Dialog>
      <DialogTrigger
        asChild
        {...props}
        onClick={() => track("ReportCardOpen", { address })}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="min-w-[740px] lg:min-w-[950px]">
        <DialogTitle>Share your report card</DialogTitle>
        <DialogDescription>
          This report card will show your ranking based on your staking period.
        </DialogDescription>
        <div className="relative" ref={ref}>
          <img src={imageUrl} alt="Report Card" className="h-auto w-full" />
          <img
            src={blo(address as any)}
            alt="Address"
            className="absolute top-[40%] left-[15%] shrink-0 rounded-full md:size-[100px] lg:size-[130px]"
          />
          <div className="absolute top-[60%] left-[31%] font-mono text-xl font-bold lg:text-2xl">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <div className="absolute top-[74%] left-[16%] text-4xl font-bold lg:text-5xl">
            {formatter.duration(stakingPeriod)}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCopy} variant="outline" className="flex-1">
            <Copy />
            Copy Image
          </Button>
          <Button onClick={onDownload} variant="purple" className="flex-1">
            <Save />
            Save Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
