import { MyProfile } from "./my-profile"

export const metadata = {
  title: "My Walrus Profile",
  description:
    "View your staking positions, rewards, and unstake timelines in one place.",
  openGraph: {
    title: "My Walrus Profile",
    description:
      "View your staking positions, rewards, and unstake timelines in one place.",
  },
}

export default function ProfilePage() {
  return <MyProfile />
}
