import { track as trackVercel } from "@vercel/analytics"
import z from "zod"

const TRACK_EVENT = {
  ClickWalletConnect: z.undefined(),
  ShareAddress: z.object({
    address: z.string(),
  }),
  StakeDialogOpen: z.object({
    operatorId: z.string(),
  }),
  Stake: z.object({
    operatorId: z.string(),
    amount: z.number(),
  }),
  UnstakeDialogOpen: z.object({
    operatorId: z.string().optional(),
    amount: z.number(),
  }),
  Unstake: z.object({
    operatorId: z.string().optional(),
    amount: z.number(),
  }),
  WithdrawDialogOpen: z.object({
    isWithdrawAll: z.boolean(),
    amount: z.number(),
  }),
  Withdraw: z.object({
    isWithdrawAll: z.boolean(),
    amount: z.number(),
  }),
  CalculateReward: z.object({
    amount: z.number(),
    day: z.number(),
  }),
  ClickSearch: z.object({
    searchValue: z.string(),
    operatorId: z.string().optional(),
    walletAddress: z.string().optional(),
  }),
}

export const track = <T extends keyof typeof TRACK_EVENT>(
  event: T,
  data: z.infer<(typeof TRACK_EVENT)[T]>
) => {
  trackVercel(event, data)
}
