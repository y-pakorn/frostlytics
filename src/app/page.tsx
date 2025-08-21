import { CircleCountdown } from "@/components/circle-countdown"

export default function Home() {
  return (
    <div>
      <div className="flex flex-col items-center gap-3 md:flex-row">
        <CircleCountdown className="size-[256px]" />
      </div>
    </div>
  )
}
