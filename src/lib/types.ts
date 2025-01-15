export type AssetBalance = {
  amount: bigint
  "asset-id": number
  "is-frozen": boolean
}

export type AccountInfo = {
  address: string
  amount: bigint
  assets: AssetBalance[]
  "min-balance": number
}

export interface BonfireAssetData {
  id: number
  amount: bigint
  frozen: boolean
  decimals: number
  name?: string
  unitName?: string
  total: bigint
  decimalAmount: number
  creator: string
  reserve?: string
  url?: string
  imageSrc?: string
}

export type NetworkConfig = {
  algodToken: string // The Algod API token to use for the server
  algodServer: string // The Algod API URL to use
  algodPort: number // The Algod port to use for a localhost network
  blockExplorer?: string // The block explorer to link out to, either algoexplorer or dappflow
}

export type NetworkName = "mainnet" | "testnet" | "betanet" | "localnet"

export type NetworkConfigs = {
  [K in NetworkName]: NetworkConfig
}
