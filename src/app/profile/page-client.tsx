"use client"

import { useSearchParams } from "next/navigation"
import { CircleX } from "lucide-react"

import { isValidAddress } from "@/lib/utils"

import { MyProfile } from "./my-profile"
import { Profile } from "./profile"

export function ProfilePageClient() {
  const searchParams = useSearchParams()
  const addr = searchParams.get("addr")

  if (!addr) {
    return <MyProfile />
  }

  if (!isValidAddress(addr)) {
    return <InvalidAddress />
  }

  return <Profile address={addr} readOnly />
}

function InvalidAddress() {
  return (
    <div className="text-secondary-foreground flex h-full flex-col items-center justify-center gap-4 text-center">
      <CircleX className="text-accent-purple-dark size-11" />
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Invalid Address</h1>
        <p className="text-muted-foreground max-w-sm text-sm font-medium">
          The address you are trying to access is invalid. Please check the
          address and try again.
        </p>
      </div>
    </div>
  )
}
