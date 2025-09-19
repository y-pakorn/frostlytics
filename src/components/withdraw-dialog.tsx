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
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useBalances } from "@/hooks/use-balances"
import { suiClient } from "@/services/client"
import { StakedWal } from "@/types"

import { Button } from "./ui/button"
import {
  Dialog,
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
  const { walBalance, suiBalance } = useBalances()

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
      <DialogContent className="gap-4">
        <DialogTitle>{isWithdrawAll ? "Withdraw All" : "Withdraw"}</DialogTitle>
        <DialogDescription>
          You are about to withdraw{" "}
          {isWithdrawAll ? (
            <span className="font-bold">
              all of your staking position and reward.
            </span>
          ) : (
            <span>your staking position and reward.</span>
          )}{" "}
          Please confirm the details below.
        </DialogDescription>
        <div className="bg-primary rounded-2xl p-4">
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
            },
            {
              label: "Transfer To",
              value: `${account?.address.slice(0, 10)}...${account?.address.slice(-8)}`,
              className: "break-all font-mono",
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
                  "text-foreground line-clamp-1 truncate font-medium break-all",
                  item.className
                )}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="purple"
          size="lg"
          className="w-full"
          onClick={() => withdrawWal.mutateAsync()}
          disabled={withdrawWal.isPending}
        >
          {!withdrawWal.isPending ? (
            "Withdraw"
          ) : (
            <>
              Withdrawing <Loader2 className="animate-spin" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
