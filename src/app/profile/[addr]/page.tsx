import { Metadata } from "next"
import { CircleX } from "lucide-react"

import { isValidAddress } from "@/lib/utils"
import { getSuiNameCached } from "@/services"

import { Profile } from "../profile"

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ addr: string }>
}): Promise<Metadata> => {
  const { addr } = await params
  const isValid = isValidAddress(addr)

  if (!isValid) {
    return {
      title: "Invalid Address",
      openGraph: {
        title: "Invalid Address",
      },
    }
  }

  const name = await getSuiNameCached(addr)
  const displayName = name || addr
  return {
    title: `${displayName}`,
    description: `${displayName}'s profile on Walrus`,
    openGraph: {
      title: `${displayName}`,
      description: `${displayName}'s profile on Walrus`,
    },
  }
}

export const revalidate = 86400 // 24 hours

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ addr: string }>
}) {
  const { addr } = await params
  const isValid = isValidAddress(addr)

  if (!isValid) {
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
