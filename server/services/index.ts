import BigNumber from "bignumber.js"
import _ from "lodash"
import memoizee from "memoizee"

import { MinimalOperatorWithMetadata, OperatorMetadata } from "../../src/types/operator"
import { walrus } from "../../src/config/walrus"

import {
  batchGetObject,
  recursiveGetDynamicFields,
  recursiveGetMultiObjects,
  suiClient,
} from "./client"

const _getAllOperators = async (): Promise<
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

const _getOperatorMetadata = async (
  metadataId: string
): Promise<OperatorMetadata> => {
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

const _getSuiName = async (address: string): Promise<string | null> => {
  const name = await suiClient
    .resolveNameServiceNames({
      address,
    })
    .catch(() => null)
  return name?.data?.[0] || null
}

const _getOperatorProfiles = async () => {
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
    await new Promise((resolve) => setTimeout(resolve, 300))
    operatorProfiles.push(...metadatas)
  }
  return _.compact(operatorProfiles)
}

const _getMinimalOperatorWithMetadata = async (
  operatorId: string
): Promise<MinimalOperatorWithMetadata | null> => {
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

// Memoized exports
export const getAllOperators = memoizee(_getAllOperators, {
  promise: true,
  maxAge: 3_600_000, // 1h
})

export const getOperatorMetadata = memoizee(_getOperatorMetadata, {
  promise: true,
  maxAge: 86_400_000, // 24h
  max: 500,
  normalizer: ([metadataId]: [string]) => metadataId,
})

export const getSuiName = memoizee(_getSuiName, {
  promise: true,
  maxAge: 86_400_000, // 24h
  max: 2000,
  normalizer: ([address]: [string]) => address,
})

export const getOperatorProfiles = memoizee(_getOperatorProfiles, {
  promise: true,
  maxAge: 86_400_000, // 24h
  preFetch: true,
})

export const getMinimalOperatorWithMetadata = memoizee(
  _getMinimalOperatorWithMetadata,
  {
    promise: true,
    maxAge: 86_400_000, // 24h
    max: 500,
    normalizer: ([operatorId]: [string]) => operatorId,
  }
)
