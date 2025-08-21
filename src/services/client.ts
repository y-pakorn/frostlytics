import { cache } from "react"
import {
  DynamicFieldInfo,
  getFullnodeUrl,
  SuiClient,
  SuiObjectDataOptions,
} from "@mysten/sui/client"
import _ from "lodash"

export const suiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
})

export const recursiveGetDynamicFields = cache(
  async ({ parentId }: { parentId: string }) => {
    const limit = 50
    const data: DynamicFieldInfo[] = []
    let cursor = null
    while (true) {
      const fields = await suiClient.getDynamicFields({
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
)

export const recursiveGetMultiObjects = cache(
  async ({
    objectIds,
    options,
  }: {
    objectIds: string[]
    options?: SuiObjectDataOptions
  }) => {
    const limit = 50
    return Promise.all(
      _.chain(objectIds)
        .chunk(limit)
        .map(async (chunk) => {
          return suiClient.multiGetObjects({
            ids: chunk,
            options,
          })
        })
        .value()
    ).then((d) => _.flatMap(d))
  }
)
