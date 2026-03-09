import { SuiGraphQLClient } from "@mysten/sui/graphql"
import {
  CoinStruct,
  DynamicFieldInfo,
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient,
  SuiObjectDataFilter,
  SuiObjectDataOptions,
  SuiObjectResponse,
} from "@mysten/sui/jsonRpc"
import {
  create,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit"
// Full lodash import required for _.chain() usage
import _ from "lodash"

export const suiClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl("mainnet"),
  network: "mainnet",
})

export const suiGraphQLClient = new SuiGraphQLClient({
  url: "https://graphql.mainnet.sui.io/graphql",
  network: "mainnet",
})

export const recursiveGetDynamicFields = async ({
  parentId,
  client = suiClient,
}: {
  parentId: string
  client?: SuiJsonRpcClient
}) => {
  const limit = 50
  const data: DynamicFieldInfo[] = []
  let cursor = null
  while (true) {
    const fields = await client.getDynamicFields({
      parentId,
      limit: 50,
      cursor,
    })

    data.push(...fields.data)

    if (fields.data.length === limit) {
      cursor = fields.nextCursor
    } else {
      break
    }
  }

  return data
}

export const recursiveGetMultiObjects = async ({
  objectIds,
  options,
  client = suiClient,
}: {
  objectIds: string[]
  options?: SuiObjectDataOptions
  client?: SuiJsonRpcClient
}) => {
  const limit = 50
  return Promise.all(
    _.chain(objectIds)
      .chunk(limit)
      .map(async (chunk) => {
        return client.multiGetObjects({
          ids: chunk,
          options,
        })
      })
      .value()
  ).then((d) => _.flatMap(d))
}

export const batchGetObject = create<
  SuiObjectResponse[],
  string,
  SuiObjectResponse
>({
  fetcher: async (ids) => {
    return await suiClient.multiGetObjects({
      ids,
      options: {
        showContent: true,
      },
    })
  },
  resolver: (it, q) => it.find((i) => i.data?.objectId === q)!,
  scheduler: windowedFiniteBatchScheduler({ windowMs: 50, maxBatchSize: 50 }),
})

export const recursiveGetCoins = async ({
  owner,
  coinType,
  client = suiClient,
}: {
  owner: string
  coinType: string
  client?: SuiJsonRpcClient
}) => {
  const data: CoinStruct[] = []
  let cursor = null
  while (true) {
    const coins = await client.getCoins({
      owner,
      coinType,
      limit: 50,
      cursor,
    })

    data.push(...coins.data)

    if (!coins.hasNextPage) {
      break
    }

    cursor = coins.nextCursor
  }

  return data
}

export const recursiveGetOwnedObjects = async ({
  owner,
  filter,
  client = suiClient,
}: {
  owner: string
  filter?: SuiObjectDataFilter
  client?: SuiJsonRpcClient
}) => {
  const data: SuiObjectResponse[] = []
  let cursor = null
  while (true) {
    const objects = await client.getOwnedObjects({
      owner,
      filter,
      limit: 50,
      cursor,
      options: {
        showContent: true,
      },
    })

    data.push(...objects.data)

    if (!objects.hasNextPage) {
      break
    }

    cursor = objects.nextCursor
  }

  return data
}
