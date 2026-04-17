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

export const delegationsRoutes = new Elysia({ tags: ["Delegations"] }).get(
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
      operatorId: t.String({ description: "Operator's Sui object ID (0x-prefixed, 66 chars)" }),
      pageIndex: t.String({ description: "Zero-based page index for pagination (20 items per page)" }),
    }),
    detail: {
      summary: "List delegation history for an operator",
      description:
        "Returns a paginated history of staking/unstaking events for a specific operator, sorted by timestamp descending. Each entry includes the delegator address, amount, activation epoch, timestamp, state (e.g. STAKED, UNSTAKED), transaction digest, and resolved Sui Name Service name. Results are cached for 1 minute. Data is sourced from Blockberry API.",
    },
    response: {
      200: t.Object({
        delegations: t.Array(
          t.Tuple([
            t.String({ description: "Delegator's Sui address" }),
            t.Number({ description: "Amount of WAL (in base units, divide by 10^9 for WAL)" }),
            t.Number({ description: "Epoch when the delegation was activated" }),
            t.Number({ description: "Unix timestamp (milliseconds) of the delegation event" }),
            t.String({ description: "Delegation state: STAKED, UNSTAKED, WITHDRAWN, etc." }),
            t.String({ description: "Sui transaction digest for this delegation event" }),
            t.Union([t.String(), t.Null()], { description: "Resolved Sui Name Service name, or null" }),
          ]),
          { description: "Array of delegation tuples: [address, amount, activationEpoch, timestamp, state, txDigest, suiName]" }
        ),
        totalPages: t.Number({ description: "Total number of pages available" }),
        total: t.Number({ description: "Total number of delegation events for this operator" }),
      }),
    },
  }
)
