import { env } from "@/env.mjs"

import { images } from "./image"

export const siteConfig = {
  name: "Frostlytics",
  author: "Frostlytics",
  description:
    "Frostlytics is a dashboard for staking and analyzing the performance of Walrus.",
  keywords: [],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "Author",
  },
  twitter: "@frostlytics",
  favicon: images.logo,
}
