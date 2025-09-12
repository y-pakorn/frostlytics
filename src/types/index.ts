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

export interface DelegatorResponse {
  delegators: [string, number, number, string | null][]
  totalPages: number
  total: number
}

export interface DelegationResponse {
  delegations: [
    string,
    number,
    number,
    number,
    "Staked" | "Withdrawing" | (string & {}),
    string,
    string | null,
  ][]
  totalPages: number
  total: number
}

export interface OperatorTransaction {
  digest: string
  sender: string
  name?: string
  txLabel?: string
  txCount: number
  timestamp: string
  gas: number
  status: "SUCCESS" | "FAIL" | (string & {})
}

export interface OperatorTransactionResponse {
  transactions: OperatorTransaction[]
  pageInfo: {
    startCursor: string | null
  }
}

export interface HistoricalData {
  timestamp: string
  paidFeesUSD: number | null
  totalStakedWAL: number | null
  storageUsedTB: number | null
}
