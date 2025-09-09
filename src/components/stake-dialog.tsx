import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit"
import { SuiTransactionBlockResponse } from "@mysten/sui/client"
import { Transaction } from "@mysten/sui/transactions"
import { useQueryClient } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import { ExternalLink, Info, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import { toast } from "sonner"
import z from "zod"

import { OperatorWithSharesAndBaseApy } from "@/types/operator"
import { images } from "@/config/image"
import { links } from "@/config/link"
import { walrus } from "@/config/walrus"
import { formatter } from "@/lib/formatter"
import { useBalances } from "@/hooks/use-balances"
import { recursiveGetCoins, suiClient } from "@/services/client"
import { useStaking } from "@/hooks"

import { GradientBorderCard } from "./gradient-border-card"
import { OperatorHeader } from "./operator-header"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
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
    .finite("Staking amount must be a finite number")
    .gte(
      walrus.minimumStaking,
      `Staking amount must be greater or equal to ${walrus.minimumStaking} WAL`
    ),
})

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

  const form = useForm<z.infer<typeof stakeFormSchema>>({
    resolver: zodResolver(stakeFormSchema),
    criteriaMode: "firstError",
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const onSubmit = async (data: z.infer<typeof stakeFormSchema>) => {
    if (!account) return

    if (!walBalance.data || walBalance.data.lt(data.amount)) {
      form.setError("amount", {
        message: "Insufficient WAL balance",
      })
      return
    }
    const useAll = walBalance.data.eq(data.amount)

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
      return
    }

    queryClient.refetchQueries({
      queryKey: ["staked-wal", account.address],
      exact: true,
    })
    suiBalance.refetch()
    walBalance.refetch()
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-4">
        <DialogTitle>Staking</DialogTitle>
        <GradientBorderCard className="space-y-3">
          <OperatorHeader operator={operator} />
          <div className="space-y-1">
            {[
              {
                label: "Voting Weight",
                value: formatter.percentage(operator.weight),
              },
              {
                label: "APY",
                value: formatter.percentage(operator.apy),
              },
              {
                label: "Commission",
                value: formatter.percentage(operator.commissionRate),
              },
              {
                label: "Total Staked",
                value: `${formatter.numberReadable(operator.staked)} WAL`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <div className="text-accent-purple font-medium">
                  {item.label}
                </div>
                <div className="text-foreground font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </GradientBorderCard>
        <div className="text-lg font-bold">Stake</div>
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
                      placeholder="Enter staking amount"
                      disabled={!walBalance.data || !account}
                    />
                  </FormControl>

                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="text-tertiary">Available</div>
                    <div className="flex-1" />
                    {formatter.number(
                      walBalance.data || 0,
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
                          if (walBalance.data) {
                            field.onChange()
                            form.setValue(
                              "amount",
                              parseFloat(
                                walBalance.data.multipliedBy(value).toFixed(9)
                              )
                            )
                            form.clearErrors("amount")
                          }
                        }}
                        size="sm"
                        className="flex-1"
                        disabled={!walBalance.data || !account}
                      >
                        {formatter.percentage(value)}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!staking ? (
              <Skeleton className="h-[110px] w-full" />
            ) : (
              <div className="flex gap-2 rounded-2xl border p-2">
                <Button variant="outline" size="iconSm">
                  <Info />
                </Button>
                <div className="text-secondary text-sm font-semibold">
                  <div>
                    Your staking reward will start in{" "}
                    <span className="underline">
                      epoch{" "}
                      {staking.isAfterMidpoint
                        ? staking.epoch + 2
                        : staking.epoch + 1}
                    </span>
                  </div>
                  <div className="text-tertiary font-medium">
                    Rewards for your stake will begin in{" "}
                    <span className="underline">
                      epoch{" "}
                      {staking.isAfterMidpoint
                        ? staking.epoch + 2
                        : staking.epoch + 1}
                    </span>{" "}
                    and only while the storage node serves as an active
                    committee member.
                  </div>
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              variant="purple"
              disabled={
                form.formState.isSubmitting || !walBalance.data || !account
              }
            >
              {!form.formState.isSubmitting ? (
                "Stake"
              ) : (
                <>
                  Staking <Loader2 className="animate-spin" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
