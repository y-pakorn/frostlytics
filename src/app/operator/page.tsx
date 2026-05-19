import { Metadata } from "next"
import { Suspense } from "react"

import { OperatorPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Staking & Operators",
  description:
    "Browse Walrus staking operators, compare APY and commission, and manage your stake.",
}

export default function OperatorPage() {
  return (
    <Suspense>
      <OperatorPageClient />
    </Suspense>
  )
}
