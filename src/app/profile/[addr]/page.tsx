import { isValidAddress } from "@/lib/utils"
import { getSuiNameCached } from "@/services"

import { ExternalProfile } from "./external-profile"

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ addr: string }>
}) => {
  const { addr } = await params
  const isValid = isValidAddress(addr)

  if (!isValid) {
    return {
      title: "Invalid Address",
    }
  }

  const name = await getSuiNameCached(addr)
  const displayName = name || `${addr.slice(0, 6)}...${addr.slice(-4)}`
  return {
    title: `${displayName}`,
    description: `${displayName}'s profile on Walrus`,
  }
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ addr: string }>
}) {
  return <ExternalProfile params={params} />
}
