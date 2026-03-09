import posthog from "posthog-js"

import { env } from "./env.mjs"

if (env.NEXT_PUBLIC_POSTHOG_TOKEN && env.NEXT_PUBLIC_POSTHOG_HOST)
  posthog.init(env.NEXT_PUBLIC_POSTHOG_TOKEN, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
  })
