export const links = {
  becomeValidator:
    "https://docs.wal.app/operator-guide/operator-guide.html?highlight=operator#operator-guide",
  docs: "https://docs.frostlytics.com",
  twitter: "https://x.com/frostlytics",
  account: (address: string) => `https://suiscan.xyz/account/${address}`,
  object: (objectId: string) => `https://suiscan.xyz/object/${objectId}`,
  transaction: (transactionId: string) =>
    `https://suiscan.xyz/tx/${transactionId}`,
}
