"use client"

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
import {
  DIALOG_OPERATOR_BOX_CLASS,
  DIALOG_SUMMARY_BOX_CLASS,
  UNSTAKE_CTA_CLASS,
} from "@/lib/dialog-styles"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useBalances } from "@/hooks/use-balances"
import { suiClient } from "@/services/client"
import { StakedWalWithStatus } from "@/types"

import { OperatorHeader } from "./operator-header"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogClose,
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
import { GlassInput } from "./ui/glass-input"
import { GlassPill } from "./ui/glass-pill"
import { Skeleton } from "./ui/skeleton"

const unstakeFormSchema = z.object({
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
  const { walBalance } = useBalances()

  const form = useForm<
    z.input<typeof unstakeFormSchema>,
    any,
    z.output<typeof unstakeFormSchema>
  >({
    resolver: zodResolver(unstakeFormSchema),
    criteriaMode: "firstError",
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const onSubmit = async (data: z.output<typeof unstakeFormSchema>) => {
    if (!account) return

    if (data.amount > stakedWal.amount) {
      form.setError("amount", {
        message: "Unstaking amount must be less than or equal to staked amount",
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
      track("UnstakeError", { operatorId: operator?.id, error: error.message })
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
      toast.error("Unstaking error", {
        description: txResult.effects?.status.error,
      })
      track("UnstakeError", {
        operatorId: operator?.id,
        error: txResult.effects?.status.error || "Unknown error",
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

  const canSubmit =
    account &&
    walBalance &&
    !form.formState.isSubmitting &&
    form.formState.isValid

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
      <DialogContent variant="glass" className="gap-0">
        <div className="space-y-4 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">Unstaking</DialogTitle>
          <DialogDescription className="sr-only">
            You are about to unstake your WAL from the operator. Please confirm
            the details below.
          </DialogDescription>

          <div className={DIALOG_OPERATOR_BOX_CLASS}>
            {operator ? (
              <OperatorHeader operator={operator} className="w-full" />
            ) : (
              <Skeleton className="h-10 w-full" />
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel asterisk className="font-bold">
                      Amount
                    </FormLabel>
                    <FormControl>
                      <NumericFormat
                        {...field}
                        value={field.value as number | undefined}
                        customInput={GlassInput}
                        placeholder={`Enter unstake amount (minimum ${walrus.minimumStaking} WAL)`}
                        disabled={!account}
                      />
                    </FormControl>

                    <div className="flex items-center justify-between pt-1 text-sm">
                      <span className="text-tertiary font-medium">
                        Available
                      </span>
                      <span className="text-foreground flex items-center gap-1 font-medium">
                        {formatter.number(stakedWal.amount || 0, walrus.decimals)}
                        <img
                          src={images.wal}
                          alt="walrus"
                          className="size-4 shrink-0"
                        />
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[0.25, 0.5, 0.75, 1].map((value) => (
                        <GlassPill
                          key={value}
                          type="button"
                          contentClassName="w-full justify-center font-semibold text-secondary-foreground"
                          className="flex-1"
                          onClick={() => {
                            const amount = parseFloat(
                              new BigNumber(stakedWal.amount)
                                .multipliedBy(value)
                                .toFixed(walrus.decimals)
                            )
                            form.setValue("amount", amount, {
                              shouldValidate: true,
                            })
                            form.clearErrors("amount")
                            track("UnstakeAmountSelect", {
                              operatorId: operator?.id,
                              percentage: value,
                              amount,
                            })
                          }}
                          disabled={!account}
                        >
                          {formatter.percentage(value)}
                        </GlassPill>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={DIALOG_SUMMARY_BOX_CLASS}>
                {[
                  {
                    label: "Estimated Rewards",
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
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-tertiary font-bold">{item.label}</span>
                    <span className="text-foreground font-medium">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </form>
          </Form>
        </div>

        <div className="flex gap-3 px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-6">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-auto flex-1 rounded-full py-2.5"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            variant="error"
            className={cn(UNSTAKE_CTA_CLASS, !canSubmit && "opacity-60")}
            disabled={!canSubmit}
            onClick={form.handleSubmit(onSubmit)}
          >
            {!form.formState.isSubmitting ? (
              "Unstake"
            ) : (
              <>
                Unstaking <Loader2 className="animate-spin" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
