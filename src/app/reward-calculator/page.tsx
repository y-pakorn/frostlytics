import { Metadata } from "next"

import { siteConfig } from "@/config/site"

import RewardCalculator from "./calculator"

export const metadata: Metadata = {
  title: "Reward Calculator",
  description: "Calculate your rewards on Walrus staking",
  openGraph: {
    images: [siteConfig.ogImages.calculator],
  },
}

export default function RewardCalculatorPage() {
  return <RewardCalculator />
}
