import { Metadata } from "next"
import { CircleX } from "lucide-react"

import { isValidAddress } from "@/lib/utils"
import { getMinimalOperatorsWithMetadataCached } from "@/services"

import { Operator } from "./operator"

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
  const { id } = await params

  if (!isValidAddress(id)) {
    return {
      title: "Invalid Address",
      openGraph: {
        title: "Invalid Address",
      },
    }
  }

  const operator = await getMinimalOperatorsWithMetadataCached(id)

  if (!operator) {
    return {
      title: "Operator Not Found",
      openGraph: {
        title: "Operator Not Found",
      },
    }
  }

  return {
    title: `${operator.name} - Walrus Operator`,
    description: `${operator.name} Operator on Walrus. View their details, APY, commission, and stake. ${operator.description}`,
    openGraph: {
      title: `${operator.name} - Walrus Operator`,
      description: `${operator.name} Operator on Walrus. View their details, APY, commission, and stake. ${operator.description}`,
    },
  }
}

export const revalidate = 86400 // 24 hours

export default async function OperatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params

  if (!isValidAddress(id)) {
    return <InvalidOperator />
  }

  const operator = await getMinimalOperatorsWithMetadataCached(id)

  if (!operator) {
    return <OperatorNotFound />
  }

  return <Operator operator={operator} searchParams={searchParams} />
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

function OperatorNotFound() {
  return (
    <div className="text-secondary-foreground flex h-full flex-col items-center justify-center gap-4 text-center">
      <CircleX className="text-accent-purple-dark size-11" />
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Operator Not Found</h1>
        <p className="text-muted-foreground max-w-sm text-sm font-medium">
          The operator you are trying to access does not exist. Please check the
          operator ID and try again.
        </p>
      </div>
    </div>
  )
}
