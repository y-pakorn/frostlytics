"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import z from "zod"

import { formatter } from "@/lib/formatter"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GradientBorderCard } from "@/components/gradient-border-card"

const validators = [
  {
    name: "Mysten Labs 0",
    id: "0xf11fef95c8c5a17c2cbc51c15483e38585cf996110b8d50b8e1957442dc736fd",
    totalStaked: "25,515,385.3516",
    votingWeight: "0.45",
    apy: "0.67",
    commission: "80",
  },
  {
    name: "Mysten Labs 1",
    id: "0x1f11fef95c8c5a17c2cbc51c15483e38585cf996110b8d50b8e1957442dc736fd",
    totalStaked: "13,842,910.1247",
    votingWeight: "0.32",
    apy: "0.89",
    commission: "75",
  },
]

const MAIN_SECTION_WIDTH = "383px"

const rewardFormSchema = z.object({
  apy: z.coerce.number().gt(0, "APY must be greater than 0"),
  amount: z.coerce.number().gt(0, "Staking amount must be greater than 0"),
  day: z.coerce.number().gt(0, "Staking period must be greater than 0"),
})

export default function RewardCalculatorPage() {
  const form = useForm<z.infer<typeof rewardFormSchema>>({
    resolver: zodResolver(rewardFormSchema),
  })

  const [result, setResult] = useState<{
    total: number
    daily: number
    weekly: number
    monthly: number
    day: number
  } | null>(null)

  const onSubmit = ({ apy, amount, day }: z.infer<typeof rewardFormSchema>) => {
    // reward are compounded weekly
    // Calculate the number of years for the staking period
    const years = day / 365
    // Compound weekly: n = 52, t = years
    const total = amount * Math.pow(1 + apy / 100 / 52, 52 * years) - amount
    // Calculate daily, weekly, and monthly rewards based on the *interest earned* (not total)
    const daily = total / day
    const weekly = daily * 7
    const monthly = daily * 30.44
    setResult({ total, daily, weekly, monthly, day })
  }

  return (
    <div
      className="flex gap-4"
      style={
        {
          "--main-section-width": MAIN_SECTION_WIDTH,
        } as React.CSSProperties
      }
    >
      <div className="w-[var(--main-section-width)] space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-accent-purple-light text-4xl font-semibold">
            Reward Calculator
          </h1>
          <p className="font-medium">
            Estimate your potential rewards based on staking amount and staking
            period
          </p>
        </div>
        <h2 className="text-lg font-bold">Staking Reward</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="apy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>APY</FormLabel>
                  <FormControl>
                    <NumericFormat
                      {...field}
                      customInput={Input}
                      placeholder="Enter preferable APY%"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>Staking Amount</FormLabel>
                  <FormControl>
                    <NumericFormat
                      {...field}
                      customInput={Input}
                      placeholder="Enter staking amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>Staking Period (Days)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <NumericFormat
                        {...field}
                        customInput={Input}
                        placeholder="Enter staking period"
                      />
                    </FormControl>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => field.onChange(30)}
                    >
                      30D
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => field.onChange(365)}
                    >
                      365D
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => field.onChange(730)}
                    >
                      730D
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <GradientBorderCard className="my-4">
              <div className="space-y-2">
                <div className="text-secondary">Total estimated reward</div>
                <div className="flex items-center gap-2">
                  <div className="text-foreground text-xl font-bold">
                    {result ? `${formatter.number(result.total)} WAL` : "-"}
                  </div>
                  <div className="ml-auto text-right text-xs">
                    <div>Staking Period</div>
                    <div className="text-accent-purple-light">
                      {result ? `${result.day} days` : "-"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Daily",
                      value: result?.daily,
                    },
                    {
                      label: "Weekly",
                      value: result?.weekly,
                    },
                    {
                      label: "Monthly",
                      value: result?.monthly,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-md bg-black/25 px-3 py-2"
                    >
                      <div>{label}</div>
                      <div className="text-foreground truncate">
                        {value ? `${formatter.number(value, 2)} WAL` : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GradientBorderCard>
            <Button
              type="submit"
              variant="purple"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Calculate
            </Button>
          </form>
        </Form>
      </div>
      <div className="w-full flex-1">
        <h2 className="my-6 text-lg font-bold">Matched Validator</h2>
        <Table className="flex-1">
          <TableHeader>
            <TableRow>
              <TableHead>Name/ID</TableHead>
              <TableHead>APY</TableHead>
              <TableHead>Voting Weight</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Total Staked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result ? (
              validators.map((validator) => {
                return (
                  <TableRow key={validator.id}>
                    <TableCell>
                      <div className="font-medium">{validator.name}</div>
                      <div className="text-tertiary font-mono text-sm">
                        {validator.id.slice(0, 8)}...{validator.id.slice(-8)}
                      </div>
                    </TableCell>
                    <TableCell className="text-accent-blue font-bold">
                      {validator.apy}%
                    </TableCell>
                    <TableCell className="text-secondary">
                      {validator.votingWeight}
                      <span className="text-tertiary">%</span>
                    </TableCell>
                    <TableCell className="text-secondary">
                      {validator.commission}
                      <span className="text-tertiary">%</span>
                    </TableCell>
                    <TableCell className="text-secondary">
                      {validator.totalStaked} WAL
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-tertiary h-[360px] text-center"
                >
                  Start calculate reward to view validators suggestion
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
