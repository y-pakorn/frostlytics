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
  metadata?: {
    description: string
    imageUrl: string
    projectUrl: string
  }
}

export interface OperatorWithSharesAndBaseApy extends PoolOperator {
  isCommittee: boolean
  apy: number
  apyWithCommission: number
  pct: number
  weight: number
}
