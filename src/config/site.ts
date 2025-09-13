import { env } from "@/env.mjs"

import { images } from "./image"

export const siteConfig = {
  name: "Frostlytics",
  author: "Frostlytics",
  description:
    "All-in-one analytics for Walrus: APY, staking, operator, fees, and supply.",
  keywords: [],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "Author",
  },
  twitter: "@frostlytics",
  favicon: images.logo,
}
