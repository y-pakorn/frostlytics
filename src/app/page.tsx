"use client"

import { ChevronDown, Search, TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, YAxis } from "recharts"

import { images } from "@/config/image"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CircleCountdown } from "@/components/circle-countdown"
import { GradientBorderCard } from "@/components/gradient-border-card"
import { Watermark } from "@/components/watermark"

const validators = [
  {
    name: "Mysten Labs 0",
    id: "0xf11fef95c8c5a17c2cbc51c15483e38585cf996110b8d50b8e1957442dc736fd",
    totalStaked: "25,515,385.3516",
    apy: "0.67",
    commission: "80",
  },
  {
    name: "Studio Mirai",
    id: "0xb07ab3db6b190fe6e32e499e7c79499786174689ae835485c178da0e9a977180",
    totalStaked: "25,291,177.7264",
    apy: "0.72",
    commission: "45",
  },
]

const staked = {
  "0xf11fef95c8c5a17c2cbc51c15483e38585cf996110b8d50b8e1957442dc736fd": {
    amount: "42",
    value: "115",
  },
} as Record<string, { amount: string; value: string }>

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
                label: "Storage Usage (TB)",
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
                label: "Total Paid Fee (WAL)",
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
        <div className="font-semibold">All Operators</div>
        <div className="bg-accent-purple text-primary-foreground rounded-full px-2 py-1 text-xs font-bold">
          200
        </div>
        <div className="flex-1" />
        <div className="relative md:w-[330px]">
          <Input placeholder="Enter Operator Name" className="pl-10" />
          <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        </div>
        <Button variant="outline">
          All Operators <ChevronDown className="size-4" />
        </Button>
        <Button variant="purple">Manage your staking</Button>
      </div>
      <div className="flex items-center gap-2">
        <Table className="flex-1">
          <TableHeader>
            <TableRow>
              <TableHead>Name/ID</TableHead>
              <TableHead>APY%</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Total Staked</TableHead>
              <TableHead className="text-foreground text-end">
                Your Staking
              </TableHead>
              <TableHead className="text-foreground text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validators.map((validator) => {
              const s = staked[validator.id]
              return (
                <TableRow key={validator.id}>
                  <TableCell>
                    <div className="font-medium">{validator.name}</div>
                    <div className="text-tertiary font-mono text-sm">
                      {validator.id.slice(0, 8)}...{validator.id.slice(-8)}
                    </div>
                  </TableCell>
                  <TableCell className="text-secondary">
                    {validator.apy}%
                  </TableCell>
                  <TableCell className="text-secondary">
                    {validator.commission}%
                  </TableCell>
                  <TableCell className="text-secondary">
                    {validator.totalStaked} WAL
                  </TableCell>
                  <TableCell className="text-end">
                    {s ? (
                      <>
                        <div className="font-bold">{s.amount} WAL</div>
                        <div className="text-tertiary font-semibold">
                          ${s.value}
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="purpleSecondary" size="sm">
                      Unstake
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
