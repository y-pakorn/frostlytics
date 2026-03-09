import { Elysia, t } from "elysia"
import _ from "lodash"
import memoizee from "memoizee"

import { isValidAddress } from "../../src/lib/utils"
import { getSuiName } from "../services"

const _getDelegations = async ({
  operatorId,
  pageIndex = 0,
}: {
  operatorId: string
  pageIndex?: number
}) => {
  const response = await fetch(
    `https://api.blockberry.one/walrus-mainnet/v1/validators/${operatorId}/staking-history?page=${pageIndex}&size=20&orderBy=DESC&sortBy=TIMESTAMP`,
    {
      headers: {
        "x-api-key": process.env.BLOCKBERRY_API_KEY!,
      },
    }
  )
  const data = (await response.json()) as any
  return {
    delegations: data.content.map((d: any) => [
      d.owner,
      d.amount,
      d.activationEpoch,
      d.timestamp,
      d.state,
      d.txDigest,
    ]) as [string, number, number, number, string, string][],
    totalPages: data.totalPages as number,
    total: data.totalElements as number,
  }
}

const getDelegations = memoizee(_getDelegations, {
  promise: true,
  maxAge: 60_000, // 1 minute
  normalizer: ([args]: [{ operatorId: string; pageIndex?: number }]) =>
    `${args.operatorId}-${args.pageIndex ?? 0}`,
  max: 1000,
})

export const delegationsRoutes = new Elysia().get(
  "/api/delegations/:operatorId/:pageIndex",
  async ({ params }) => {
    const { operatorId, pageIndex } = params

    if (!operatorId || !isValidAddress(operatorId)) {
      throw new Error("Operator ID is required")
    }

    const pageIndexInt = parseInt(pageIndex)

    const data = await getDelegations({
      operatorId,
      pageIndex: pageIndexInt,
    })

    const namesIndividual = await Promise.all(
      data.delegations.map(async (d) => [d[0], await getSuiName(d[0])])
    ).then((d) =>
      _.chain(d)
        .filter((d) => !!d[1])
        .fromPairs()
        .value()
    )

    return {
      ...data,
      delegations: data.delegations.map((d) => [
        ...d,
        namesIndividual[d[0]] || null,
      ]),
    }
  },
  {
    params: t.Object({
      operatorId: t.String(),
      pageIndex: t.String(),
    }),
  }
)
