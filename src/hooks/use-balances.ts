import { useCurrentAccount, useSuiClientQueries } from "@mysten/dapp-kit"
import BigNumber from "bignumber.js"

import { walrus } from "@/config/walrus"

export const useBalances = ({ address }: { address?: string } = {}) => {
  const currentAccount = useCurrentAccount()
  const usedAddress = address || currentAccount?.address

  const [walBalance, suiBalance] = useSuiClientQueries({
    queries: [
      {
        method: "getBalance",
        params: {
          owner: usedAddress || "",
          coinType: walrus.walToken,
        },
        options: {
          queryKey: ["wal-balance", usedAddress],
          enabled: !!usedAddress,
          select: (data) =>
            new BigNumber(data.totalBalance).div(walrus.denominator),
        },
      },
      {
        method: "getBalance",
        params: {
          owner: usedAddress || "",
          coinType: walrus.suiToken,
        },
        options: {
          queryKey: ["sui-balance", usedAddress],
          enabled: !!usedAddress,
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
