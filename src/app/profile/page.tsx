import { MyProfile } from "./my-profile"

export const metadata = {
  title: "My Profile",
  description: "View your profile and staking activity on Walrus",
}

export default function ProfilePage() {
  return <MyProfile />
}
