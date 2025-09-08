import { useQuery } from "@tanstack/react-query"

export const usePrices = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["prices"],
    refetchInterval: 30_000, // 30 seconds
    queryFn: async () => {
      const response = await fetch(
        "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=SUI,WAL&tsyms=USD"
      )
      const data = await response.json()
      return {
        sui: {
          price: data.RAW.SUI.USD.PRICE,
          change24h: data.RAW.SUI.USD.CHANGE24HOUR,
        },
        wal: {
          price: data.RAW.WAL.USD.PRICE,
          change24h: data.RAW.WAL.USD.CHANGE24HOUR,
        },
      }
    },
  })
  return { data, isLoading, error }
}
