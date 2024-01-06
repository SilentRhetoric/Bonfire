import { AccountInfo, AssetData } from "solid-algo-wallets"
import { BonfireAssetData } from "./types"
import { decodeAddress } from "algosdk"
import axios from "axios"
import { CID } from "multiformats/cid"
import * as digest from "multiformats/hashes/digest"
import * as mfsha2 from "multiformats/hashes/sha2"

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

export function calcExtraLogs(acctInfo: AccountInfo): number {
  const extraLogs = Math.floor((acctInfo.amount - acctInfo["min-balance"]) / 100000)
  return extraLogs
}

export const IPFS_ENDPOINT = "https://ipfs.algonode.xyz/ipfs"

export async function ipfsFromAsset(asset: BonfireAssetData): Promise<string> {
  if (!asset.url) return ""
  try {
    const optimizer = "?optimizer=image&width=450&quality=70"
    if (asset.reserve && asset.url.includes("template-ipfs")) {
      const { data, cid } = await getARC19AssetData(asset.url, asset.reserve)
      const url = data.image ? data.image : `${IPFS_ENDPOINT}/${cid}${optimizer}`
      if (url.startsWith("ipfs://")) return `${IPFS_ENDPOINT}/${url.slice(7)}${optimizer}`
      if (url !== "") return url
      return ""
    }
    if (asset.url.endsWith("#arc3")) {
      const url = asset.url.slice(0, -5)
      if (url.startsWith("ipfs://")) {
        const response = await axios.get(`${IPFS_ENDPOINT}/${url.slice(7)}`)
        if (response.data.image.startsWith("ipfs://")) {
          return `${IPFS_ENDPOINT}/${response.data.image.slice(7)}${optimizer}`
        }
        return response.data.image
      } else {
        const response = await axios.get(url)
        if (response.data.image.startsWith("ipfs://")) {
          return `${IPFS_ENDPOINT}/${response.data.image.slice(7)}${optimizer}`
        }
        return response.data.image
      }
    }
    if (asset.url.startsWith("https://") && asset.url.includes("ipfs")) {
      return `${IPFS_ENDPOINT}/${asset.url.split("/ipfs/")[1]}${optimizer}`
    }
    if (asset.url.startsWith("ipfs://")) {
      return `${IPFS_ENDPOINT}/${asset.url.slice(7)}${optimizer}`
    }
    return asset.url
  } catch (error) {
    return ""
  }
}

export async function getARC19AssetData(url: string, reserve: string) {
  try {
    const chunks = url.split("://")
    if (chunks[0] === "template-ipfs" && chunks[1].startsWith("{ipfscid:")) {
      const cidComponents = chunks[1].split(":")
      const cidVersion = parseInt(cidComponents[1])
      const cidCodec = cidComponents[2]
      let cidCodecCode
      if (cidCodec === "raw") {
        cidCodecCode = 0x55
      } else if (cidCodec === "dag-pb") {
        cidCodecCode = 0x70
      } else {
        throw new Error("Unknown codec")
      }
      const addr = decodeAddress(reserve)
      const mhdigest = digest.create(mfsha2.sha256.code, addr.publicKey)
      const cid = cidVersion === 1 ? CID.createV1(cidCodecCode, mhdigest) : CID.createV0(mhdigest)
      const response = await axios.get(`${IPFS_ENDPOINT}/${cid}`)
      return { data: response.data, cid: cid }
    } else {
      throw new Error("invalid url" + url)
    }
  } catch (error) {
    throw new Error("invalid url" + url)
  }
}
