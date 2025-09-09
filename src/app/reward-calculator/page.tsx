import { Metadata } from "next"

import RewardCalculator from "./calculator"

export const metadata: Metadata = {
  title: "Reward Calculator",
  description: "Calculate your rewards on Walrus staking",
  openGraph: {
    title: "Reward Calculator",
    description: "Calculate your rewards on Walrus staking",
  },
}

export default function RewardCalculatorPage() {
  return <RewardCalculator />
}
