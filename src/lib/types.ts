import { AssetData } from "solid-algo-wallets"

export interface BonfireAssetData extends AssetData {
  decimalAmount: number
  burnAmount?: number
}