export interface StakedWal {
  id: string
  nodeId: string
  amount: number
  type: "staked" | "withdrawing"
  activationEpoch: number
  withdrawEpoch: number
  rawAmount: string
}

export interface StakedWalWithStatus extends StakedWal {
  status: "staked" | "withdrawing" | "claimable"
  canWithdrawRightNow: boolean
  withdrawToEpoch: number
}
