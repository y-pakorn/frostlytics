import { useQuery } from "@tanstack/react-query"

export const useCirculatingSupply = () => {
  return useQuery({
    queryKey: ["circulating-supply"],
    staleTime: Infinity,
    queryFn: async () => {
      // const response = await fetch(
      //   "https://sui-circulation.suiexplorer.com/api/wal/current_month_wal_circulation"
      // )
      // return response.json() as unknown as number
      return 1446250000
    },
  })
}
