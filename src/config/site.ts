import { env } from "@/env.mjs"

import { images } from "./image"

export const siteConfig = {
  name: "Frostlytics",
  author: "Frostlytics",
  description:
    "Frostlytics is a platform for analyzing the performance of the Frost network.",
  keywords: [],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "Author",
  },
  twitter: "",
  favicon: images.logo,
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
