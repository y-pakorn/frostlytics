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

export const delegatorsRoutes = new Elysia({ tags: ["Delegators"] }).get(
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
      operatorId: t.String({ description: "Operator's Sui object ID (0x-prefixed, 66 chars)" }),
      pageIndex: t.String({ description: "Zero-based page index for pagination (20 items per page)" }),
    }),
    detail: {
      summary: "List delegators for an operator",
      description:
        "Returns a paginated list of delegators who have staked WAL tokens with a specific operator. Each delegator entry includes their address, staked amount, activation epoch, and resolved Sui Name Service name (if available). Results are cached for 1 hour. Data is sourced from Blockberry API.",
    },
    response: {
      200: t.Object({
        delegators: t.Array(
          t.Tuple([
            t.String({ description: "Delegator's Sui address" }),
            t.Number({ description: "Amount of WAL staked (in base units, divide by 10^9 for WAL)" }),
            t.Number({ description: "Epoch when the delegation was activated" }),
            t.Union([t.String(), t.Null()], { description: "Resolved Sui Name Service name, or null" }),
          ]),
          { description: "Array of delegator tuples: [address, amount, activationEpoch, suiName]" }
        ),
        totalPages: t.Number({ description: "Total number of pages available" }),
        total: t.Number({ description: "Total number of delegators for this operator" }),
      }),
    },
  }
)
