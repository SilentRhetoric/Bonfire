import { AssetData } from "solid-algo-wallets"

export function ellipseString(string = "", width = 4): string {
  return `${string.slice(0, width)}...${string.slice(-width)}`
}

// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
export function numberWithCommas(num: number | string): string {
  const num_parts = num.toString().split(".")
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return num_parts.join(".")
}

export function formatNumWithDecimals(num: number, decimals: number): string {
  const shifted_num = (num /= Math.pow(10, decimals))
  const shifted_num_string = shifted_num.toString()
  return shifted_num_string
}

export function displayAssetAmount(asset: AssetData) {
  try {
    return formatNumWithDecimals(asset.amount, asset.decimals)
  } catch (e) {
    return "0"
  }
}

export function makeBigIntAmount(decimal_amount: number, asset: AssetData): bigint {
  const bigIntAmount = BigInt(decimal_amount * Math.pow(10, asset.decimals))
  return bigIntAmount
}

export function makeIntegerAmount(decimal_amount: number, asset: AssetData): number {
  const intAmount = decimal_amount * Math.pow(10, asset.decimals)
  return intAmount
}

export function numberToDecimal(num: number, decimals: number): number {
  const shifted_num = (num /= Math.pow(10, decimals))
  const shifted_num_string = shifted_num
  return shifted_num_string
}
