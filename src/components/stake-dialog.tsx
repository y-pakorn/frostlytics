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
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react"
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
import { recursiveGetCoins, suiClient } from "@/services/client"
import { useStaking } from "@/hooks"

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

const stakeFormSchema = z.object({
  amount: z.coerce
    .number()
    .finite("Staking amount must be a finite number")
    .gte(
      walrus.minimumStaking,
      `Staking amount must be greater or equal to ${walrus.minimumStaking} WAL`
    ),
})

import {
  DIALOG_OPERATOR_BOX_CLASS,
  STAKE_CTA_CLASS,
} from "@/lib/dialog-styles"

export function StakeDialog({
  children,
  operator,
}: {
  children: React.ReactNode
  operator: OperatorWithSharesAndBaseApy
}) {
  const [open, setOpen] = useState(false)

  const account = useCurrentAccount()
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction()
  const staking = useStaking()
  const queryClient = useQueryClient()
  const { walBalance, suiBalance } = useBalances()

  const form = useForm<
    z.input<typeof stakeFormSchema>,
    any,
    z.output<typeof stakeFormSchema>
  >({
    resolver: zodResolver(stakeFormSchema),
    criteriaMode: "firstError",
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const activationEpoch = staking
    ? staking.isAfterMidpoint
      ? staking.epoch + 2
      : staking.epoch + 1
    : null

  const insufficientSui = suiBalance != null && suiBalance.lt(0.006)

  const onSubmit = async (data: z.output<typeof stakeFormSchema>) => {
    if (!account) return

    if (!walBalance || walBalance.lt(data.amount)) {
      form.setError("amount", {
        message: "Insufficient WAL balance",
      })
      return
    }
    const useAll = walBalance.eq(data.amount)

    const walCoins = await recursiveGetCoins({
      coinType: walrus.walToken,
      owner: account!.address,
    })

    const rawAmount = new BigNumber(data.amount)
      .shiftedBy(walrus.decimals)
      .toString()
    const tx = new Transaction()
    const usedCoin = walCoins[0].coinObjectId
    if (walCoins.length > 1) {
      tx.mergeCoins(
        walCoins[0].coinObjectId,
        walCoins.slice(1).map((coin) => coin.coinObjectId)
      )
    }
    const splittedCoin = tx.splitCoins(usedCoin, [rawAmount])
    const [stakedWal] = tx.moveCall({
      package: walrus.walrus,
      module: "staking",
      function: "stake_with_pool",
      arguments: [
        tx.object(walrus.staking),
        tx.object(splittedCoin),
        tx.pure.id(operator.id),
      ],
      typeArguments: [],
    })
    tx.transferObjects([stakedWal], account.address)
    if (!useAll) {
      tx.transferObjects([usedCoin], account.address)
    }
    const result = await signAndExecuteTransaction({
      transaction: tx,
    }).catch((error) => {
      toast.error("Execute transaction error", {
        description: error.message,
      })
      track("StakeError", { operatorId: operator.id, error: error.message })
      throw error
    })
    const txResultPromise = suiClient.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
      },
    })
    toast.promise(txResultPromise, {
      loading: "Staking...",
      error: (e: Error) => ({
        message: "Staking error",
        description: e.message,
      }),
    })
    const txResult = await txResultPromise
    if (txResult.effects?.status.status !== "success") {
      toast.error("Staking error", {
        description: txResult.effects?.status.error,
      })
      track("StakeError", {
        operatorId: operator.id,
        error: txResult.effects?.status.error || "Unknown error",
      })
      return
    }

    track("Stake", { operatorId: operator.id, amount: data.amount })

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
    toast.success("Staked successfully", {
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
    form.formState.isValid &&
    !insufficientSui

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        onClick={() => {
          track("StakeDialogOpen", { operatorId: operator.id })
        }}
      >
        {children}
      </DialogTrigger>
      <DialogContent variant="glass" className="gap-0">
        <div className="space-y-4 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">Staking</DialogTitle>
          <DialogDescription className="sr-only">
            You are about to stake your WAL to the operator. Please confirm the
            details below.
          </DialogDescription>

          <div className={DIALOG_OPERATOR_BOX_CLASS}>
            <OperatorHeader operator={operator} className="w-full" />
            <div className="space-y-1 text-sm">
              {[
                {
                  label: "Voting Weight",
                  value: `${formatter.percentage(operator.pct, { percent: false })}%`,
                },
                {
                  label: "APY%",
                  value: formatter.percentage(operator.apyWithCommission),
                },
                {
                  label: "Commission",
                  value: formatter.percentage(operator.commissionRate),
                },
                {
                  label: "Total Stake",
                  value: `${formatter.numberReadable(operator.staked)} WAL`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="text-brand-400 font-medium">{item.label}</div>
                  <div className="text-foreground font-normal">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
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
                        placeholder="Enter stake amount (minimum 1 WAL)"
                        disabled={!walBalance || !account}
                      />
                    </FormControl>

                    <div className="flex items-center justify-between pt-1 text-sm">
                      <span className="text-tertiary font-medium">
                        Available
                      </span>
                      <span className="text-foreground flex items-center gap-1 font-medium">
                        {formatter.number(walBalance || 0, walrus.decimals)}
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
                            if (walBalance) {
                              const amount = parseFloat(
                                walBalance.multipliedBy(value).toFixed(9)
                              )
                              form.setValue("amount", amount, {
                                shouldValidate: true,
                              })
                              form.clearErrors("amount")
                              track("StakeAmountSelect", {
                                operatorId: operator.id,
                                percentage: value,
                                amount,
                              })
                            }
                          }}
                          disabled={!walBalance || !account}
                        >
                          {formatter.percentage(value)}
                        </GlassPill>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!staking ? (
                <Skeleton className="h-12 w-full rounded-xl" />
              ) : (
                <div className="bg-background flex items-center justify-between rounded-xl px-3 py-3">
                  <div className="text-tertiary text-sm font-bold">
                    Activation Epoch
                  </div>
                  <div className="text-foreground text-base font-medium">
                    Epoch {activationEpoch}
                  </div>
                </div>
              )}

              {insufficientSui ? (
                <div className="bg-surface-elevated/40 flex gap-3 rounded-xl border border-[#fec84b]/80 p-4">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#dc6803]" />
                  <div className="space-y-1 text-sm">
                    <div className="text-secondary-foreground font-semibold">
                      Insufficient SUI balance
                    </div>
                    <div className="text-tertiary font-normal">
                      Need 0.006 SUI for transaction fee.
                    </div>
                  </div>
                </div>
              ) : null}
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
            variant="purple"
            className={cn(STAKE_CTA_CLASS, "flex-1", !canSubmit && "opacity-60")}
            disabled={!canSubmit}
            onClick={form.handleSubmit(onSubmit)}
          >
            {!form.formState.isSubmitting ? (
              "Stake"
            ) : (
              <>
                Staking <Loader2 className="animate-spin" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
