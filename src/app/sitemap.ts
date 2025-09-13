import { MetadataRoute } from "next"

import { env } from "@/env.mjs"
import { getOperatorProfileCached } from "@/services"

export const revalidate = 86400 // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const operators = await getOperatorProfileCached()
  return [
    {
      url: env.NEXT_PUBLIC_APP_URL,
      priority: 1,
      changeFrequency: "daily",
      lastModified: new Date(),
    },
    {
      url: `${env.NEXT_PUBLIC_APP_URL}/reward-calculator`,
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${env.NEXT_PUBLIC_APP_URL}/profile`,
      priority: 0.9,
      lastModified: new Date(),
    },
    ...operators.map((operator) => ({
      url: `${env.NEXT_PUBLIC_APP_URL}/operator/${operator.id}`,
      priority: 0.8,
      changeFrequency: "daily" as const,
      lastModified: new Date(),
    })),
  ]
}
