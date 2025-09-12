import { useEffect, useMemo } from "react"
import { useCurrentAccount, useSuiClientQueries } from "@mysten/dapp-kit"
import { useQuery } from "@tanstack/react-query"
import BigNumber from "bignumber.js"

import { walrus } from "@/config/walrus"

export const useBalances = ({ address }: { address?: string } = {}) => {
  const currentAccount = useCurrentAccount()
  const usedAddress = useMemo(
    () => address || currentAccount?.address || "",
    [address, currentAccount?.address]
  )

  const [walBalance, suiBalance] = useSuiClientQueries({
    queries: [
      {
        method: "getBalance",
        params: {
          owner: usedAddress,
          coinType: walrus.walToken,
        },
      },
      {
        method: "getBalance",
        params: {
          owner: usedAddress,
          coinType: walrus.suiToken,
        },
      },
    ],
  })

  const memoizedWalBalance = useMemo(() => {
    return walBalance.data
      ? new BigNumber(walBalance.data.totalBalance).div(walrus.denominator)
      : null
  }, [walBalance])

  const memoizedSuiBalance = useMemo(() => {
    return suiBalance.data
      ? new BigNumber(suiBalance.data.totalBalance).div(walrus.denominator)
      : null
  }, [suiBalance])

  return {
    walBalance: memoizedWalBalance,
    suiBalance: memoizedSuiBalance,
  }
}
