import { unstable_cache } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import _ from "lodash"

import { env } from "@/env.mjs"
import { isValidAddress } from "@/lib/utils"
import { getSuiNameCached } from "@/services"

const getDelegatorsCached = unstable_cache(
  async ({
    operatorId,
    pageIndex = 0,
  }: {
    operatorId: string
    pageIndex?: number
  }) => {
    const response = await fetch(
      `https://api.blockberry.one/walrus-mainnet/v1/validators/${operatorId}/delegators?page=${pageIndex}&size=20&orderBy=DESC&sortBy=AMOUNT`,
      {
        headers: {
          "x-api-key": env.BLOCKBERRY_API_KEY,
        },
      }
    )
    const data = await response.json()
    return {
      delegators: data.content.map((d: any) => [
        d.owner,
        d.amount,
        d.activationEpoch,
      ]) as [string, number, number][],
      totalPages: data.totalPages as number,
      total: data.totalElements as number,
    }
  },
  ["delegators"],
  {
    revalidate: 3600, // 1 hours
  }
)

export const revalidate = 3600 // 1 hours
export const dynamic = "force-static"

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/delegators/[operatorId]/[pageIndex]">
) {
  const { operatorId, pageIndex } = await params

  if (!operatorId || !isValidAddress(operatorId)) {
    return NextResponse.json(
      {
        error: "Operator ID is required",
      },
      {
        status: 400,
      }
    )
  }

  const pageIndexInt = parseInt(pageIndex)

  const data = await getDelegatorsCached({
    operatorId,
    pageIndex: pageIndexInt,
  })

  const namesIndividual = await Promise.all(
    data.delegators.map(async (d) => [d[0], await getSuiNameCached(d[0])])
  ).then((d) =>
    _.chain(d)
      .filter((d) => !!d[1])
      .fromPairs()
      .value()
  )

  return NextResponse.json({
    ...data,
    delegators: data.delegators.map((d) => [...d, namesIndividual[d[0]]]),
  })
}
