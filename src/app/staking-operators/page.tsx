import { Metadata } from "next"

import StakingOperatorsPage from "./staking-operators"

export const metadata: Metadata = {
  title: "Staking & Operators",
  description:
    "Browse Walrus staking operators, compare APY and commission, and manage your stake.",
}

export default function Page() {
  return <StakingOperatorsPage />
}
