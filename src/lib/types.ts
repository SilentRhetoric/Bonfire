export type AssetBalance = {
  amount: number
  "asset-id": number
  "is-frozen": boolean
}
export type AccountInfo = {
  address: string
  amount: number
  assets: AssetBalance[]
  "min-balance": number
}
