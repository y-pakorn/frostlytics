import { Elysia, t } from "elysia"
import _ from "lodash"
import memoizee from "memoizee"

import { isValidAddress } from "../../src/lib/utils"
import { getSuiName } from "../services"

const _getDelegators = async ({
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
        "x-api-key": process.env.BLOCKBERRY_API_KEY!,
      },
    }
  )
  const data = (await response.json()) as any
  return {
    delegators: data.content.map((d: any) => [
      d.owner,
      d.amount,
      d.activationEpoch,
    ]) as [string, number, number][],
    totalPages: data.totalPages as number,
    total: data.totalElements as number,
  }
}

const getDelegators = memoizee(_getDelegators, {
  promise: true,
  maxAge: 3_600_000, // 1h
  normalizer: ([args]: [{ operatorId: string; pageIndex?: number }]) =>
    `${args.operatorId}-${args.pageIndex ?? 0}`,
  max: 1000,
})

export const delegatorsRoutes = new Elysia().get(
  "/api/delegators/:operatorId/:pageIndex",
  async ({ params }) => {
    const { operatorId, pageIndex } = params

    if (!operatorId || !isValidAddress(operatorId)) {
      throw new Error("Operator ID is required")
    }

    const pageIndexInt = parseInt(pageIndex)

    const data = await getDelegators({
      operatorId,
      pageIndex: pageIndexInt,
    })

    const namesIndividual = await Promise.all(
      data.delegators.map(async (d) => [d[0], await getSuiName(d[0])])
    ).then((d) =>
      _.chain(d)
        .filter((d) => !!d[1])
        .fromPairs()
        .value()
    )

    return {
      ...data,
      delegators: data.delegators.map((d) => [
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
