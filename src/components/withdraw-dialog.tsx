"use client"

import { useState } from "react"
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { links } from "@/config/link"
import { walrus } from "@/config/walrus"
import { track } from "@/lib/analytic"
import {
  DIALOG_SUMMARY_BOX_CLASS,
  WITHDRAW_CTA_CLASS,
} from "@/lib/dialog-styles"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useBalances } from "@/hooks/use-balances"
import { suiClient } from "@/services/client"
import { StakedWal } from "@/types"

import { Button } from "./ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"

export function WithdrawDialog({
  children,
  stakedWal,
  estimatedReward,
  isWithdrawAll = false,
}: {
  children: React.ReactNode
  stakedWal: StakedWal[]
  estimatedReward: number
  isWithdrawAll?: boolean
}) {
  const [open, setOpen] = useState(false)

  const account = useCurrentAccount()
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction()
  const queryClient = useQueryClient()
  useBalances()

  const withdrawWal = useMutation({
    mutationFn: async () => {
      if (!account) return

      const tx = new Transaction()
      const withdrawedWals = stakedWal.map((s) => {
        const [withdrawedWal] = tx.moveCall({
          package: walrus.walrus,
          module: "staking",
          function: "withdraw_stake",
          arguments: [tx.object(walrus.staking), tx.object(s.id)],
          typeArguments: [],
        })
        return withdrawedWal
      })
      const wal =
        withdrawedWals.length === 1
          ? withdrawedWals[0]
          : tx.mergeCoins(withdrawedWals[0], withdrawedWals.slice(1))
      tx.transferObjects([wal], account.address)

      const result = await signAndExecuteTransaction({
        transaction: tx,
      }).catch((error) => {
        toast.error("Execute transaction error", {
          description: error.message,
        })
        track("WithdrawError", { isWithdrawAll, error: error.message })
        throw error
      })
      const txResultPromise = suiClient.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
        },
      })
      toast.promise(txResultPromise, {
        loading: "Withdrawing...",
        error: (e: Error) => ({
          message: "Withdraw error",
          description: e.message,
        }),
      })
      const txResult = await txResultPromise
      if (txResult.effects?.status.status !== "success") {
        toast.error("Withdraw error", {
          description: txResult.effects?.status.error,
        })
        track("WithdrawError", {
          isWithdrawAll,
          error: txResult.effects?.status.error || "Unknown error",
        })
        return
      }

      track("Withdraw", {
        isWithdrawAll,
        amount: stakedWal.reduce((acc, s) => acc + s.amount, 0),
      })

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
      toast.success("Withdraw successfully", {
        description: result.digest,
        action: {
          label: <ExternalLink className="size-4" />,
          onClick: () => {
            window.open(links.transaction(result.digest), "_blank")
          },
        },
      })

      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        onClick={() => {
          track("WithdrawDialogOpen", {
            isWithdrawAll,
            amount: stakedWal.reduce((acc, s) => acc + s.amount, 0),
          })
        }}
      >
        {children}
      </DialogTrigger>
      <DialogContent variant="glass" className="gap-0">
        <div className="space-y-4 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">
            {isWithdrawAll ? "Withdraw All" : "Withdraw"}
          </DialogTitle>
          <DialogDescription>
            You are about to withdraw{" "}
            {isWithdrawAll ? (
              <span className="font-bold">
                all of your staking positions and rewards.
              </span>
            ) : (
              <span>your staking position and reward.</span>
            )}{" "}
            Please confirm the details below.
          </DialogDescription>

          <div className={DIALOG_SUMMARY_BOX_CLASS}>
            {[
              ...(isWithdrawAll
                ? [
                    {
                      label: "From",
                      value: (
                        <>
                          {stakedWal.length}{" "}
                          <span className="text-tertiary">positions</span>
                        </>
                      ),
                      className: undefined,
                    },
                  ]
                : []),
              {
                label: "Staking Reward",
                value: (
                  <>
                    {formatter.number(estimatedReward, 4)}{" "}
                    <span className="text-tertiary">WAL</span>
                  </>
                ),
                className: undefined,
              },
              {
                label: "Transfer To",
                value: `${account?.address.slice(0, 10)}...${account?.address.slice(-8)}`,
                className: "font-mono",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-tertiary shrink-0 font-bold">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-foreground truncate font-medium",
                    item.className
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
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
            variant="error"
            className={cn(
              WITHDRAW_CTA_CLASS,
              withdrawWal.isPending && "opacity-60"
            )}
            disabled={withdrawWal.isPending}
            onClick={() => withdrawWal.mutateAsync()}
          >
            {!withdrawWal.isPending ? (
              isWithdrawAll ? "Withdraw All" : "Withdraw"
            ) : (
              <>
                Withdrawing <Loader2 className="animate-spin" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
