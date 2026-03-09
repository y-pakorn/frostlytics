import { useEffect, useRef } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"

import { identifyUser, resetUser, track } from "@/lib/analytic"

export function usePosthogIdentify() {
  const account = useCurrentAccount()
  const prevAddress = useRef<string | null>(null)

  useEffect(() => {
    const address = account?.address ?? null

    if (address && address !== prevAddress.current) {
      identifyUser(address)
      track("WalletConnected", { address })
    }

    if (!address && prevAddress.current) {
      resetUser()
      track("WalletDisconnected", undefined)
    }

    prevAddress.current = address
  }, [account?.address])
}
