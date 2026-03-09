"use client"

import { useSearchParams } from "next/navigation"
import { CircleX } from "lucide-react"

import { isValidAddress } from "@/lib/utils"

import { Operator } from "./operator"

export default function OperatorPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const tab = searchParams.get("tab") ?? undefined

  if (!id || !isValidAddress(id)) {
    return <InvalidOperator />
  }

  return <Operator id={id} defaultTab={tab} />
}

function InvalidOperator() {
  return (
    <div className="text-secondary-foreground flex h-full flex-col items-center justify-center gap-4 text-center">
      <CircleX className="text-accent-purple-dark size-11" />
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Invalid Operator ID</h1>
        <p className="text-muted-foreground max-w-sm text-sm font-medium">
          The operator ID you are trying to access is invalid. Please check the
          operator ID and try again.
        </p>
      </div>
    </div>
  )
}
