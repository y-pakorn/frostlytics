import { sendGAEvent } from "@next/third-parties/google"
import posthog from "posthog-js"
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
  StakeAmountSelect: z.object({
    operatorId: z.string(),
    percentage: z.number(),
    amount: z.number(),
  }),
  StakeError: z.object({
    operatorId: z.string(),
    error: z.string(),
  }),
  UnstakeDialogOpen: z.object({
    operatorId: z.string().optional(),
    amount: z.number(),
  }),
  Unstake: z.object({
    operatorId: z.string().optional(),
    amount: z.number(),
  }),
  UnstakeAmountSelect: z.object({
    operatorId: z.string().optional(),
    percentage: z.number(),
    amount: z.number(),
  }),
  UnstakeError: z.object({
    operatorId: z.string().optional(),
    error: z.string(),
  }),
  WithdrawDialogOpen: z.object({
    isWithdrawAll: z.boolean(),
    amount: z.number(),
  }),
  Withdraw: z.object({
    isWithdrawAll: z.boolean(),
    amount: z.number(),
  }),
  WithdrawError: z.object({
    isWithdrawAll: z.boolean(),
    error: z.string(),
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
  NavigationClick: z.object({
    destination: z.string(),
    label: z.string(),
  }),
  TabChange: z.object({
    tabName: z.string(),
    operatorId: z.string(),
  }),
  ExternalLinkClick: z.object({
    url: z.string(),
    label: z.string(),
  }),
  CopyToClipboard: z.object({
    contentType: z.enum([
      "operatorId",
      "walletAddress",
      "positionId",
      "commissionReceiver",
      "governanceAuthorized",
      "profileLink",
    ]),
  }),
  TableSort: z.object({
    table: z.string(),
    column: z.string(),
    direction: z.string(),
  }),
  TableFilter: z.object({
    table: z.string(),
    filterValue: z.string(),
  }),
  TableSearch: z.object({
    table: z.string(),
    query: z.string(),
  }),
  TablePagination: z.object({
    table: z.string(),
    page: z.number(),
  }),
  WalletConnected: z.object({
    address: z.string(),
  }),
  WalletDisconnected: z.undefined(),
  ProfileView: z.object({
    address: z.string(),
    isOwnProfile: z.boolean(),
  }),
  StakeStatusFilter: z.object({
    status: z.string(),
  }),
  CalculatorPresetClick: z.object({
    days: z.number(),
  }),
  ReportCardOpen: z.object({
    address: z.string(),
  }),
  ReportCardCopy: z.object({
    address: z.string(),
  }),
  ReportCardSave: z.object({
    address: z.string(),
  }),
}

export const track = <T extends keyof typeof TRACK_EVENT>(
  event: T,
  data: z.infer<(typeof TRACK_EVENT)[T]>
) => {
  sendGAEvent("event", event, data || {})
  posthog.capture(event, data || {})
}

export const identifyUser = (address: string) => {
  posthog.identify(address)
}

export const resetUser = () => {
  posthog.reset()
}
