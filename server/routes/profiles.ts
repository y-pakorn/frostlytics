import { Elysia } from "elysia"

import { getOperatorProfiles } from "../services"

export const profilesRoutes = new Elysia().get("/api/profiles", async () => {
  try {
    const operators = await getOperatorProfiles()
    return {
      total: operators.length,
      operators,
    }
  } catch (error) {
    throw new Error((error as Error).message)
  }
})
