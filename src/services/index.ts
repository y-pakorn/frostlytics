import { cache } from "react"
import { unstable_cache } from "next/cache"
import { bcs } from "@mysten/sui/bcs"
import { Transaction } from "@mysten/sui/transactions"
import BigNumber from "bignumber.js"
import _ from "lodash"

import { MinimalOperatorWithMetadata, OperatorMetadata } from "@/types/operator"
import { walrus } from "@/config/walrus"

import {
  batchGetObject,
  recursiveGetDynamicFields,
  recursiveGetMultiObjects,
  suiClient,
} from "./client"

export const getAllOperators = cache(
  async (): Promise<
    {
      id: string
      name: string
      metadataId: string
    }[]
  > => {
    const poolIds = await recursiveGetDynamicFields({
      parentId: walrus.pool,
    })
    const poolObjects = await recursiveGetMultiObjects({
      objectIds: poolIds.map((pool) => pool.objectId),
      options: {
        showContent: true,
      },
    })

    const pools = poolObjects.map((pool) => {
      const content = pool.data?.content as any

      const id = pool.data?.objectId!
      const name = content.fields.node_info.fields.name
      const metadataId = content.fields.node_info.fields.metadata.fields.id.id

      return {
        id,
        name,
        metadataId,
      }
    })

    return pools
  }
)

export const getOperatorMetadata = cache(
  async (metadataId: string): Promise<OperatorMetadata> => {
    const dynIds = await suiClient.getDynamicFields({
      parentId: metadataId,
    })
    const dyn = await batchGetObject.fetch(dynIds.data[0].objectId)
    const content = (dyn.data?.content as any).fields.value.fields
    return {
      description: content.description,
      imageUrl: content.image_url,
      projectUrl: content.project_url,
    }
  }
)

export const getSuiName = cache(
  async (address: string): Promise<string | null> => {
    const name = await suiClient
      .resolveNameServiceNames({
        address,
      })
      .catch(() => null)
    return name?.data?.[0] || null
  }
)

export const getSuiNameCached = unstable_cache(getSuiName, ["sui-name"], {
  revalidate: 86400, // 24 hours
})

export const getMinimalOperatorWithMetadata = cache(
  async (operatorId: string): Promise<MinimalOperatorWithMetadata | null> => {
    const operatorObject = await batchGetObject.fetch(operatorId)

    if (!operatorObject || !operatorObject.data) {
      return null
    }

    const content = operatorObject.data?.content as any

    const id = operatorObject.data?.objectId!
    const name = content.fields.node_info.fields.name
    const metadataId = content.fields.node_info.fields.metadata.fields.id.id
    const metadata = await getOperatorMetadata(metadataId)

    return {
      id,
      name,
      ...metadata,
    }
  }
)

export const getMinimalOperatorsWithMetadataCached = unstable_cache(
  getMinimalOperatorWithMetadata,
  ["minimal-operators-with-metadata"],
  {
    revalidate: 86400, // 24 hours
  }
)

export const getOperatorProfileCached = cache(
  unstable_cache(
    async () => {
      const operators = await getAllOperators()
      const operatorProfiles = []
      for (const chunkedOperators of _.chunk(operators, 10)) {
        const metadatas = await Promise.all(
          chunkedOperators.map((operator) =>
            getOperatorMetadata(operator.metadataId).then((metadata) =>
              !metadata.description &&
              !metadata.imageUrl &&
              !metadata.projectUrl
                ? null
                : {
                    id: operator.id,
                    ...metadata,
                  }
            )
          )
        )
        await new Promise((resolve) => setTimeout(resolve, 300)) // 100ms delay to avoid rate limiting
        operatorProfiles.push(...metadatas)
      }
      return _.compact(operatorProfiles)
    },
    ["operator-profile"],
    {
      revalidate: 86400, // 24 hours
    }
  )
)
