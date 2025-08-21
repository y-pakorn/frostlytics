"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, YAxis } from "recharts"

import { images } from "@/config/image"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CircleCountdown } from "@/components/circle-countdown"
import { GradientBorderCard } from "@/components/gradient-border-card"

const apyData = [
  { date: "Jan 10, 2025", value: 15 },
  { date: "Jan 20, 2025", value: 25 },
  { date: "Jan 30, 2025", value: 18 },
  { date: "Feb 10, 2025", value: 30 },
  { date: "Feb 20, 2025", value: 22 },
  { date: "Feb 28, 2025", value: 28 },
  { date: "Mar 10, 2025", value: 20 },
  { date: "Mar 20, 2025", value: 27 },
  { date: "Mar 30, 2025", value: 19 },
  { date: "Apr 10, 2025", value: 31 },
  { date: "Apr 20, 2025", value: 23 },
  { date: "Apr 30, 2025", value: 29 },
  { date: "May 10, 2025", value: 21 },
  { date: "May 20, 2025", value: 26 },
  { date: "May 30, 2025", value: 17 },
  { date: "Jun 10, 2025", value: 32 },
  { date: "Jun 20, 2025", value: 24 },
  { date: "Jun 30, 2025", value: 28 },
  { date: "Jul 10, 2025", value: 20 },
  { date: "Jul 20, 2025", value: 27 },
]
const stakedData = [
  { date: "Jan 10, 2025", value: 10 },
  { date: "Feb 10, 2025", value: 10 },
  { date: "Mar 10, 2025", value: 11 },
  { date: "Apr 10, 2025", value: 11 },
  { date: "May 10, 2025", value: 12 },
  { date: "Jun 10, 2025", value: 12 },
  { date: "Jul 10, 2025", value: 12 },
  { date: "Aug 10, 2025", value: 12 },
]

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <CircleCountdown className="size-[256px] shrink-0" />
        <div className="shrink-0 space-y-2">
          <GradientBorderCard>
            <div>Average Staking APY%</div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-foreground text-2xl font-bold">
                  22% APY
                </div>
                <div>MAX APY% 60%</div>
              </div>
              <ChartContainer
                config={{
                  value: {
                    color: "var(--color-success-foreground)",
                    label: "APY%",
                  },
                }}
                className="h-[56px] w-[83px]"
              >
                <LineChart data={apyData}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </GradientBorderCard>
          <div className="flex items-center gap-2">
            <GradientBorderCard className="h-full">
              <div>WAL Price</div>
              <img src={images.wal} alt="WAL" className="my-1 size-6" />
              <div className="flex items-center gap-1">
                <div className="text-foreground font-bold">$0.045</div>
                <TrendingUp className="text-success-foreground size-4" />
                <div className="text-success-foreground">+1.2%</div>
              </div>
            </GradientBorderCard>
            <GradientBorderCard>
              <div>Total CEX Flow</div>
              <div className="text-foreground mt-7 font-bold">13.25M WAL</div>
            </GradientBorderCard>
          </div>
          <GradientBorderCard>
            <div className="flex items-center gap-2">
              <div>Circulating Supply</div>
              <div className="text-foreground ml-auto font-bold">$1.38B</div>
            </div>
          </GradientBorderCard>
        </div>
        <GradientBorderCard className="h-full w-full">
          <div>Total Staked</div>
          <div className="text-foreground text-xl">2,200,444 WAL</div>
          <ChartContainer
            className="mt-2 max-h-[170px] w-full"
            config={{
              value: {
                color: "var(--color-accent-blue)",
                label: "Staked",
              },
            }}
          >
            <LineChart data={stakedData}>
              <CartesianGrid vertical={false} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </GradientBorderCard>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="active">Staking</Button>
        <Button variant="inactive">Ecosystem</Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="shrink-0 space-y-2">
          <GradientBorderCard>
            <div>Shards</div>
            <div className="text-foreground text-base font-bold">1,000</div>
            <div>Individual Data Partitions</div>
          </GradientBorderCard>
          <div className="flex items-center gap-2">
            <GradientBorderCard>
              <div>Storage Price</div>
              <div className="text-foreground text-base font-bold">11,000</div>
              <div>Frost/MiB/Epoch</div>
            </GradientBorderCard>
            <GradientBorderCard>
              <div>Write Price</div>
              <div className="text-foreground text-base font-bold">20,000</div>
              <div>Frost/MiB</div>
            </GradientBorderCard>
          </div>
        </div>
        <GradientBorderCard className="h-full w-full">
          <div>Total Storage Usage</div>
          <div className="text-foreground text-xl">311,572 TB</div>
          <ChartContainer
            className="mt-2 max-h-[100px] w-full"
            config={{
              value: {
                color: "var(--color-accent-purple)",
                label: "Staked",
              },
            }}
          >
            <LineChart data={stakedData}>
              <CartesianGrid vertical={false} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </GradientBorderCard>
        <GradientBorderCard className="h-full w-full">
          <div>Total Paid Fee</div>
          <div className="text-foreground text-xl">1048.16 WAL</div>
          <ChartContainer
            className="mt-2 max-h-[100px] w-full"
            config={{
              value: {
                color: "var(--color-accent-purple)",
                label: "Staked",
              },
            }}
          >
            <LineChart data={stakedData}>
              <CartesianGrid vertical={false} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </GradientBorderCard>
      </div>
    </div>
  )
}
