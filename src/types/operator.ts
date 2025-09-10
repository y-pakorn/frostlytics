export interface PoolOperator {
  id: string
  name: string
  metadataId: string
  address: string
  staked: number
  shares: number
  capacityTB: number
  latestEpoch: number
  activationEpoch: number
  commissionRate: number
  rewardsPool: number
  commissionReceiver?: string
  governaceAuthorized?: string
  storagePrice: number
  writePrice: number
  state: "Active" | (string & {})
  commission: number
  pendingSharesWithdraw: number
  pendingStake: number
  preActiveWithdrawals: number
}

export interface OperatorMetadata {
  description: string
  imageUrl: string
  projectUrl: string
}

export interface OperatorWithSharesAndBaseApy extends PoolOperator {
  isCommittee: boolean
  apy: number
  apyWithCommission: number
  pct: number
  weight: number
  metadata?: OperatorMetadata
}

export interface OperatorMetadataWithId extends OperatorMetadata {
  id: string
}

export interface MinimalOperatorWithMetadata extends OperatorMetadataWithId {
  name: string
}
