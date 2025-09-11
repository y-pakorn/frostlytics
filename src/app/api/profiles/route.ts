import { NextApiRequest, NextApiResponse } from "next"
import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import _ from "lodash"

import { getAllOperators, getOperatorMetadata } from "@/services"

const getOperatorProfileCached = unstable_cache(
  async () => {
    const operators = await getAllOperators()
    const operatorProfiles = []
    for (const chunkedOperators of _.chunk(operators, 10)) {
      const metadatas = await Promise.all(
        chunkedOperators.map((operator) =>
          getOperatorMetadata(operator.metadataId).then((metadata) =>
            !metadata.description && !metadata.imageUrl && !metadata.projectUrl
              ? null
              : {
                  id: operator.id,
                  ...metadata,
                }
          )
        )
      )
      operatorProfiles.push(...metadatas)
    }
    return _.compact(operatorProfiles)
  },
  ["operator-profile"],
  {
    revalidate: 86400, // 24 hours
  }
)

export const revalidate = 86400 // 24 hours
export const dynamic = "force-static"

export async function GET() {
  try {
    const operators = await getOperatorProfileCached()
    return NextResponse.json({
      total: operators.length,
      operators,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: (error as Error).message,
      },
      {
        status: 500,
      }
    )
  }
}
