import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { useQueryClient } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import { ExternalLink, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import { toast } from "sonner"
import z from "zod"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { images } from "@/config/image"
import { links } from "@/config/link"
import { walrus } from "@/config/walrus"
import { track } from "@/lib/analytic"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useBalances } from "@/hooks/use-balances"
import { suiClient } from "@/services/client"
import { StakedWalWithStatus } from "@/types"

import { GradientBorderCard } from "./gradient-border-card"
import { OperatorHeader } from "./operator-header"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { Input } from "./ui/input"
import { Skeleton } from "./ui/skeleton"

const stakeFormSchema = z.object({
  amount: z.coerce
    .number()
    .finite("Unstaking amount must be a finite number")
    .gte(
      walrus.minimumStaking,
      `Unstaking amount must be greater or equal to ${walrus.minimumStaking} WAL`
    ),
})

export function UnstakeDialog({
  children,
  operator,
  stakedWal,
  estimatedReward,
}: {
  children: React.ReactNode
  stakedWal: StakedWalWithStatus
  operator: OperatorWithSharesAndBaseApy | null
  estimatedReward: number
}) {
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction()
  const { walBalance, suiBalance } = useBalances()

  const form = useForm<z.infer<typeof stakeFormSchema>>({
    resolver: zodResolver(stakeFormSchema),
    criteriaMode: "firstError",
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const onSubmit = async (data: z.infer<typeof stakeFormSchema>) => {
    if (!account) return

    if (data.amount > stakedWal.amount) {
      form.setError("amount", {
        message:
          "Unstaking amount must be less than or equal to the estimated reward",
      })
      return
    }

    if (data.amount < walrus.minimumStaking) {
      form.setError("amount", {
        message: `Unstaking amount must be greater than or equal to ${walrus.minimumStaking} WAL`,
      })
      return
    }

    const leftAmount = stakedWal.amount - data.amount
    if (leftAmount !== 0 && leftAmount < walrus.minimumStaking) {
      form.setError("amount", {
        message: `The amount after unstaking must be greater than or equal to ${walrus.minimumStaking} WAL`,
      })
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      package: walrus.walrus,
      module: "staking",
      function: "request_withdraw_stake",
      arguments: [tx.object(walrus.staking), tx.object(stakedWal.id)],
      typeArguments: [],
    })
    const result = await signAndExecuteTransaction({
      transaction: tx,
    }).catch((error) => {
      toast.error("Execute transaction error", {
        description: error.message,
      })
      throw error
    })
    const txResultPromise = suiClient.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
      },
    })
    toast.promise(txResultPromise, {
      loading: "Unstaking...",
      error: (e: Error) => ({
        message: "Unstaking error",
        description: e.message,
      }),
    })
    const txResult = await txResultPromise
    if (txResult.effects?.status.status !== "success") {
      toast.error("Staking error", {
        description: txResult.effects?.status.error,
      })
      return
    }

    track("Unstake", { operatorId: operator?.id, amount: data.amount })

    queryClient.refetchQueries({
      queryKey: ["staked-wal", account.address],
      exact: true,
    })
    queryClient.refetchQueries({
      queryKey: ["sui-balance", account.address],
      exact: true,
    })
    queryClient.refetchQueries({
      queryKey: ["wal-balance", account.address],
      exact: true,
    })
    toast.success("Unstaked successfully", {
      description: result.digest,
      action: {
        label: <ExternalLink className="size-4" />,
        onClick: () => {
          window.open(links.transaction(result.digest), "_blank")
        },
      },
    })

    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        onClick={() => {
          track("UnstakeDialogOpen", {
            operatorId: operator?.id,
            amount: stakedWal.amount,
          })
        }}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="gap-4">
        <DialogTitle>Unstaking</DialogTitle>
        <DialogDescription className="sr-only">
          You are about to unstake your WAL from the operator. Please confirm
          the details below.
        </DialogDescription>
        <GradientBorderCard className="space-y-3">
          {operator ? (
            <OperatorHeader operator={operator} />
          ) : (
            <Skeleton className="h-10 w-full" />
          )}
        </GradientBorderCard>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asterisk>Amount</FormLabel>
                  <FormControl>
                    <NumericFormat
                      {...field}
                      customInput={Input}
                      placeholder={`Enter unstaking amount (minimum ${walrus.minimumStaking} WAL)`}
                      disabled={!walBalance || !account}
                    />
                  </FormControl>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="text-tertiary">Available</div>
                    <div className="flex-1" />
                    {formatter.number(
                      stakedWal.amount || 0,
                      walrus.decimals
                    )}{" "}
                    <img
                      src={images.wal}
                      alt="walrus"
                      className="size-4 shrink-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {[0.25, 0.5, 0.75, 1].map((value) => (
                      <Button
                        key={value}
                        variant="outline"
                        type="button"
                        onClick={() => {
                          if (walBalance) {
                            field.onChange()
                            form.setValue(
                              "amount",
                              parseFloat(
                                new BigNumber(stakedWal.amount)
                                  .multipliedBy(value)
                                  .toFixed(walrus.decimals)
                              )
                            )
                            form.clearErrors("amount")
                          }
                        }}
                        size="sm"
                        className="flex-1"
                        disabled={!walBalance || !account}
                      >
                        {formatter.percentage(value)}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="bg-primary rounded-2xl p-4">
              {[
                {
                  label: "Estimated Reward",
                  value: (
                    <>
                      {formatter.number(estimatedReward, 4)}{" "}
                      <span className="text-tertiary">WAL</span>
                    </>
                  ),
                },
                {
                  label: "Effecting Epoch",
                  value: `Epoch ${stakedWal.withdrawToEpoch}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="line-clamp-1 flex min-w-0 items-center justify-between"
                >
                  <div className="text-tertiary shrink-0 text-sm font-bold">
                    {item.label}
                  </div>
                  <div
                    className={cn(
                      "text-foreground line-clamp-1 truncate font-medium break-all"
                    )}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="purple"
              disabled={form.formState.isSubmitting || !walBalance || !account}
            >
              {!form.formState.isSubmitting ? (
                "Unstake"
              ) : (
                <>
                  Unstaking <Loader2 className="animate-spin" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
