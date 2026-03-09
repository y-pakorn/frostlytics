"use client"

import { useQuery } from "@tanstack/react-query"

import { env } from "@/env.mjs"
import { HistoricalData } from "@/types"

import Home from "./home"

export default function HomePage() {
  const { data: historicalData } = useQuery({
    queryKey: ["historical-data"],
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/historical-data`)
      return res.json() as Promise<HistoricalData[]>
    },
  })

  return <Home historicalData={historicalData ?? []} />
}
