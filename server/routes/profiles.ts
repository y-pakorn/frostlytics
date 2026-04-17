import { Elysia, t } from "elysia"

import { getOperatorProfiles } from "../services"

export const profilesRoutes = new Elysia({ tags: ["Operators"] }).get(
  "/api/profiles",
  async () => {
    try {
      const operators = await getOperatorProfiles()
      return {
        total: operators.length,
        operators,
      }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  },
  {
    detail: {
      summary: "List operator profiles",
      description:
        "Returns all Walrus network operator profiles with their on-chain metadata (name, description, image, project URL). Results are cached for 24 hours with pre-fetching enabled. Only operators with at least one metadata field populated are included.",
    },
    response: {
      200: t.Object({
        total: t.Number({ description: "Total number of operators with metadata" }),
        operators: t.Array(
          t.Object({
            id: t.String({ description: "Operator's Sui object ID (0x-prefixed, 66 chars)" }),
            description: t.Union([t.String(), t.Null()], { description: "Operator's self-reported description" }),
            imageUrl: t.Union([t.String(), t.Null()], { description: "URL to operator's avatar/logo" }),
            projectUrl: t.Union([t.String(), t.Null()], { description: "URL to operator's project or website" }),
          }),
          { description: "Array of operator profiles with metadata" }
        ),
      }),
    },
  }
)
