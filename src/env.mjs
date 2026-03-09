import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_API_URL: z.string().min(1),
    NEXT_PUBLIC_GA_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_POSTHOG_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
})
