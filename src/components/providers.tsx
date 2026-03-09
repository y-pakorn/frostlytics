"use client"

import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit"
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Frown } from "lucide-react"

import { images } from "@/config/image"
import { siteConfig } from "@/config/site"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePosthogIdentify } from "@/hooks/use-posthog-identify"

import { Icons } from "./icons"

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
  const isMobile = useIsMobile()

  if (isMobile) return <Mobile />

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

function Mobile() {
  return (
    <main className="text-secondary-foreground container flex h-screen flex-col items-center justify-center gap-4 text-center">
      <img
        className="fixed inset-0 -z-10 size-full object-cover opacity-10 blur-sm"
        src={images.bg}
        alt="Background"
      />
      <Frown className="text-accent-purple-dark size-11" />
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Mobile Not Supported Yet</h1>
        <p className="text-muted-foreground max-w-sm text-sm font-medium">
          We are sorry, but mobile is not supported yet. Please use a desktop
          browser to access and use the site.
        </p>
      </div>
    </main>
  )
}
