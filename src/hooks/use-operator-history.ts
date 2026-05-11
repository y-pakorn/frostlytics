import { useQuery } from "@tanstack/react-query"

import { env } from "@/env.mjs"

export type OperatorHistoryPoint = {
  timestamp: string
  epoch: number
  stakedWAL: number | null
  weight: number | null
  weightPercentage: number | null
  estimatedEarningsWAL: number | null
}

export type OperatorHistoryResponse = {
  operatorId: string
  firstEpoch: number | null
  latestEpoch: number | null
  tenureEpochs: number
  history: OperatorHistoryPoint[]
}

export const useOperatorHistory = (operatorId: string | null | undefined) => {
  return useQuery({
    queryKey: ["operator-history", operatorId],
    enabled: !!operatorId,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/operator-history?id=${operatorId}`
      )
      return (await res.json()) as OperatorHistoryResponse
    },
  })
}
