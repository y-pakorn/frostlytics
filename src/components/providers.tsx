"use client"

import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit"
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { siteConfig } from "@/config/site"
import { usePosthogIdentify } from "@/hooks/use-posthog-identify"

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
})
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider
          autoConnect
          slushWallet={{
            name: siteConfig.name,
          }}
        >
          <WalletIdentifier />
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}

function WalletIdentifier() {
  usePosthogIdentify()
  return null
}
