import { useCurrentAccount, useSuiClientQueries } from "@mysten/dapp-kit"
import BigNumber from "bignumber.js"

import { walrus } from "@/config/walrus"

export const useBalances = () => {
  const currentAccount = useCurrentAccount()

  const [walBalance, suiBalance] = useSuiClientQueries({
    queries: [
      {
        method: "getBalance",
        params: {
          owner: currentAccount!.address,
          coinType: walrus.walToken,
        },
        options: {
          queryKey: ["wal-balance", currentAccount?.address],
          enabled: !!currentAccount?.address,
          select: (data) =>
            new BigNumber(data.totalBalance).div(walrus.denominator),
        },
      },
      {
        method: "getBalance",
        params: {
          owner: currentAccount!.address,
          coinType: walrus.suiToken,
        },
        options: {
          queryKey: ["sui-balance", currentAccount?.address],
          enabled: !!currentAccount?.address,
          select: (data) =>
            new BigNumber(data.totalBalance).div(walrus.denominator),
        },
      },
    ],
  })

  return {
    walBalance,
    suiBalance,
  }
}
