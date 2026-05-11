import { useQuery } from "@tanstack/react-query"

import { env } from "@/env.mjs"

export type ProtocolHealthDaily = {
  timestamp: string
  epoch: number | null
  activeCount: number | null
  committeeCount: number | null
  operatorCount: number | null
  totalStakedWAL: number | null
  averageStakedWAL: number | null
  storageUsedTB: number | null
  totalStorageTB: number | null
  storagePrice: number | null
  writePrice: number | null
  paidFeesUSD: number | null
}

export type ProtocolHealthRevenue = {
  timestamp: string
  fromEpoch: number
  toEpoch: number
  grossInflowWAL: number
  userFeeWAL: number | null
  fixedRateSubsidyWAL: number | null
  usageSubsidyWAL: number | null
  poolFundingWAL: number | null
  poolDrainWAL: number | null
}

export type ProtocolHealthMover = {
  operatorId: string
  currentWeightPct: number
  weightPctChange: number
}

export type ProtocolHealthMovers = {
  gainers: ProtocolHealthMover[]
  losers: ProtocolHealthMover[]
}

export type ProtocolHealthDecentralization = {
  timestamp: string
  operatorCount: number
  nakamoto33: number
  top5Share: number
  top10Share: number
  activeStakedWAL: number
  gini: number
}

export type ProtocolHealthChurn = {
  epoch: number
  timestamp: string
  joined: number
  exited: number
  joinedIds: string[]
  exitedIds: string[]
  activeOperators: number
}

export type ProtocolHealthResponse = {
  daily: ProtocolHealthDaily[]
  revenue: ProtocolHealthRevenue[]
  decentralization: ProtocolHealthDecentralization[]
  churn: ProtocolHealthChurn[]
  movers: ProtocolHealthMovers
}

export const useProtocolHealth = () => {
  return useQuery({
    queryKey: ["protocol-health"],
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/protocol-health`
      )
      return (await res.json()) as ProtocolHealthResponse
    },
  })
}
