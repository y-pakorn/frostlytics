import "@/styles/globals.css"
import "@mysten/dapp-kit/dist/index.css"

import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"

import { env } from "@/env.mjs"
import { images } from "@/config/image"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AppNavbar } from "@/components/app-navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Providers } from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
})

interface RootLayoutProps {
  children: React.ReactNode
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.base),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.url.author,
    },
  ],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url.base,
    title: "Frostlytics - All-in-one Walrus Dashboard",
    description:
      "All-in-one analytics for Walrus: APY, staking, operator, fees, and supply.",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.twitter,
  },
}

export const viewport: Viewport = {
  themeColor: [{ color: "#0c0e12" }],
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          geist.variable,
          geistMono.variable,
          bricolage.variable
        )}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            forcedTheme="dark"
            disableTransitionOnChange
          >
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <SidebarInset className="relative flex min-h-screen w-full flex-col overflow-hidden">
                <img
                  className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 w-full object-cover object-bottom max-md:h-[40vh]"
                  src={images.gradientFooter}
                  alt=""
                  aria-hidden
                />
                <AppNavbar />
                <div className="container flex-1 py-6">{children}</div>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
          </ThemeProvider>
        </Providers>
        {env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
