import { AssetData } from "solid-algo-wallets"

export interface BonfireAssetData extends AssetData {
  decimalAmount: number
  creator: string
  reserve?: string
  url?: string
  imageSrc?: string
}
