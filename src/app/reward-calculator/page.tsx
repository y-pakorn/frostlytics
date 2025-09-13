import { Metadata } from "next"

import RewardCalculator from "./calculator"

export const metadata: Metadata = {
  title: "Walrus Reward Calculator",
  description:
    "Estimate your WAL rewards based on stake amount, APY, and time period.",
  openGraph: {
    title: "Walrus Reward Calculator",
    description:
      "Estimate your WAL rewards based on stake amount, APY, and time period.",
  },
}

export default function RewardCalculatorPage() {
  return <RewardCalculator />
}
