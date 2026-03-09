import { Suspense } from "react"

import { OperatorPageClient } from "./page-client"

export default function OperatorPage() {
  return (
    <Suspense>
      <OperatorPageClient />
    </Suspense>
  )
}
