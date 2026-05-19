"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts"

import { dayjs } from "@/lib/dayjs"
import { formatter } from "@/lib/formatter"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { HistoricalData } from "@/types"

import { ChartPanel } from "@/components/ui/chart-panel"
import { useHomeMetrics } from "./use-home-metrics"

type Range = "30d" | "90d" | "all"

const BAR_PURPLE = "var(--color-brand-400)"
const TOTAL_STAKED_COLOR = "var(--color-brand-400)"

function sliceByRange(data: HistoricalData[], range: Range) {
  if (range === "all") return data
  return data.slice(-(range === "30d" ? 30 : 90))
}

function paddedDomain(values: (number | null | undefined)[]): [number, number] {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  )
  if (!nums.length) return [0, 1]
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.05
    return [min - pad, max + pad]
  }
  const pad = (max - min) * 0.1
  return [min - pad, max + pad]
}

function barYDomain(values: (number | null | undefined)[]): [number, number] {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  )
  if (!nums.length) return [0, 1]
  const max = Math.max(...nums)
  const pad = max * 0.1 || 1
  return [0, max + pad]
}

function formatAxisDate(timestamp: string, pointCount: number) {
  const date = dayjs(timestamp)
  if (pointCount <= 35) return date.format("D MMM")
  if (pointCount <= 120) return date.format("MMM D")
  return date.format("MMM 'YY")
}

function RangeToggle({
  value,
  onChange,
}: {
  value: Range
  onChange: (value: Range) => void
}) {
  return (
    <SegmentedControl
      variant="figma"
      options={[
        { label: "30d", value: "30d" },
        { label: "90d", value: "90d" },
        { label: "All", value: "all" },
      ]}
      value={value}
      onChange={onChange}
    />
  )
}

export function NetworkActivitySection({
  historicalData,
}: {
  historicalData: HistoricalData[]
}) {
  const { totalStakedWAL } = useHomeMetrics()
  const [stakedRange, setStakedRange] = useState<Range>("30d")
  const [storageRange, setStorageRange] = useState<Range>("30d")
  const [feesRange, setFeesRange] = useState<Range>("30d")

  const totalStakedChartData = useMemo(
    () => sliceByRange(historicalData, stakedRange),
    [historicalData, stakedRange]
  )

  const storageData = useMemo(
    () => sliceByRange(historicalData, storageRange),
    [historicalData, storageRange]
  )

  const feesData = useMemo(
    () => sliceByRange(historicalData, feesRange),
    [historicalData, feesRange]
  )

  const stakedYDomain = useMemo(
    () => paddedDomain(totalStakedChartData.map((d) => d.totalStakedWAL)),
    [totalStakedChartData]
  )

  const storageYDomain = useMemo(
    () => barYDomain(storageData.map((d) => d.storageUsedTB)),
    [storageData]
  )

  const feesYDomain = useMemo(
    () => barYDomain(feesData.map((d) => d.paidFeesUSD)),
    [feesData]
  )

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-foreground text-2xl font-bold">
        Network Activity
      </h2>

      <ChartPanel
        title="Total Staked"
        height={262}
        action={<RangeToggle value={stakedRange} onChange={setStakedRange} />}
      >
        {totalStakedWAL != null && (
          <p className="text-foreground -mt-1 mb-1 text-2xl font-semibold tracking-[-0.01em]">
            {formatter.number(totalStakedWAL)} WAL
          </p>
        )}
        <ChartContainer
          watermark
          className="h-[168px] w-full"
          config={{
            totalStakedWAL: {
              color: TOTAL_STAKED_COLOR,
              label: "Total Staked",
            },
          }}
        >
          <AreaChart
            data={totalStakedChartData}
            margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="networkTotalStaked"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-totalStakedWAL)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-totalStakedWAL)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <YAxis hide domain={stakedYDomain} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--color-tertiary)" }}
              tickFormatter={(v) =>
                formatAxisDate(String(v), totalStakedChartData.length)
              }
              minTickGap={32}
              interval="preserveStartEnd"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  includeDate={{
                    key: "timestamp",
                    formatter: (v) => dayjs(v).format("MMM D, YYYY"),
                  }}
                  valueFormatter={(v) =>
                    `${formatter.numberReadable(Number(v), 2)} WAL`
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="totalStakedWAL"
              stroke="var(--color-totalStakedWAL)"
              fill="url(#networkTotalStaked)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </ChartPanel>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <ChartPanel
          title="Storage Usage"
          height={233}
          action={
            <RangeToggle value={storageRange} onChange={setStorageRange} />
          }
        >
          <p className="text-foreground -mt-1 mb-1 text-2xl font-semibold tracking-[-0.01em]">
            {formatter.number(
              storageData.length > 0
                ? (storageData[storageData.length - 1]?.storageUsedTB ?? 0)
                : 0
            )}{" "}
            TB
          </p>
          <ChartContainer
            watermark
            className="h-[193px] w-full"
            config={{
              storageUsedTB: {
                color: BAR_PURPLE,
                label: "Storage (TB)",
              },
            }}
          >
            <BarChart
              data={storageData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid vertical={false} strokeOpacity={0.12} />
              <YAxis hide domain={storageYDomain} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--color-tertiary)" }}
                tickFormatter={(v) =>
                  formatAxisDate(String(v), storageData.length)
                }
                minTickGap={32}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    includeDate={{
                      key: "timestamp",
                      formatter: (v) => dayjs(v).format("MMM D, YYYY"),
                    }}
                  />
                }
              />
              <Bar
                dataKey="storageUsedTB"
                fill={BAR_PURPLE}
                radius={[4, 4, 0, 0]}
                maxBarSize={12}
              />
            </BarChart>
          </ChartContainer>
        </ChartPanel>

        <ChartPanel
          title="Paid Fees"
          height={233}
          action={<RangeToggle value={feesRange} onChange={setFeesRange} />}
        >
          <p className="text-foreground -mt-1 mb-1 text-2xl font-semibold tracking-[-0.01em]">
            {formatter.number(
              feesData.length > 0
                ? (feesData[feesData.length - 1]?.paidFeesUSD ?? 0)
                : 0
            )}{" "}
            USD
          </p>
          <ChartContainer
            watermark
            className="h-[193px] w-full"
            config={{
              paidFeesUSD: {
                color: BAR_PURPLE,
                label: "Fees (USD)",
              },
            }}
          >
            <BarChart
              data={feesData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid vertical={false} strokeOpacity={0.12} />
              <YAxis hide domain={feesYDomain} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--color-tertiary)" }}
                tickFormatter={(v) =>
                  formatAxisDate(String(v), feesData.length)
                }
                minTickGap={32}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    includeDate={{
                      key: "timestamp",
                      formatter: (v) => dayjs(v).format("MMM D, YYYY"),
                    }}
                  />
                }
              />
              <Bar
                dataKey="paidFeesUSD"
                fill={BAR_PURPLE}
                radius={[4, 4, 0, 0]}
                maxBarSize={12}
              >
                {feesData.map((_, i) => (
                  <Cell key={i} fill={BAR_PURPLE} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartPanel>
      </div>
    </div>
  )
}
