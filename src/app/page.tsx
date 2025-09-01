import { getSharesAndBaseApyCached } from "@/services"

import Home from "./home"

export default async function HomePage() {
  const sharesAndBaseApy = await getSharesAndBaseApyCached()
  console.dir(sharesAndBaseApy, { depth: null })

  return <Home />
}
