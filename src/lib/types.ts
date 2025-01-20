export interface BonfireAssetData {
  assetId: bigint
  amount: bigint
  isFrozen: boolean
  decimals: number
  name?: string
  unitName?: string
  total: bigint
  decimalAmountAsString: string
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

export type NetworkName = "mainnet" | "testnet" | "betanet" | "fnet" | "localnet"
