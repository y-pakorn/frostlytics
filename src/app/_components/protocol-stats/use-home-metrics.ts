"use client"

import { useMemo } from "react"

import { useFullOperators } from "@/hooks"

export function useHomeMetrics() {
  const fullOperators = useFullOperators()
  const totalStakedWAL = useMemo(() => {
    if (!fullOperators) return null
    return fullOperators.reduce(
      (sum, o) =>
        sum +
        o.staked +
        o.pendingStake -
        o.pendingSharesWithdraw -
        o.preActiveWithdrawals,
      0
    )
  }, [fullOperators])

  const averageApy = useMemo(() => {
    if (!fullOperators?.length) return null
    return (
      fullOperators.reduce((s, o) => s + o.apyWithCommission, 0) /
      fullOperators.length
    )
  }, [fullOperators])

  return { totalStakedWAL, averageApy, fullOperators }
}
