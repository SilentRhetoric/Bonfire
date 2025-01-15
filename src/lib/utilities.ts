import { AccountInfo, BonfireAssetData } from "./types"
import { decodeAddress } from "algosdk"
import axios from "axios"
import { CID } from "multiformats/cid"
import * as digest from "multiformats/hashes/digest"
import * as mfsha2 from "multiformats/hashes/sha2"

export function ellipseString(string: string | null): string {
  return string ? `${string.slice(0, 3)}...${string.slice(-3)}` : ""
}

// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
export function numberWithCommas(num: number | string): string {
  const num_parts = num.toString().split(".")
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return num_parts.join(".")
}

export function formatNumWithDecimals(num: bigint, decimals: number): string {
  const shifted_num = (num /= BigInt(Math.pow(10, decimals)))
  const shifted_num_string = shifted_num.toString()
  return shifted_num_string
}

export function displayAssetAmount(asset: BonfireAssetData) {
  try {
    return formatNumWithDecimals(asset.amount, asset.decimals)
  } catch (e) {
    return "0"
  }
}

export function makeBigIntAmount(decimal_amount: number, asset: BonfireAssetData): bigint {
  const bigIntAmount = BigInt(decimal_amount * Math.pow(10, asset.decimals))
  return bigIntAmount
}

export function makeIntegerAmount(decimal_amount: number, asset: BonfireAssetData): number {
  const intAmount = decimal_amount * Math.pow(10, asset.decimals)
  return intAmount
}

export function bigintToDecimal(num: bigint | undefined, decimals: number): number {
  console.log("bigintToDecimal",num, decimals)
  if(!num) return 0
  const shifted_num = (num = BigInt(num) / BigInt(Math.pow(10, decimals)))
  console.log("shifted_num",shifted_num)
  const shifted_num_string = shifted_num
  return Number(shifted_num_string)
}
export function numberToDecimal(num: number, decimals: number): number {
  const shifted_num = (num /= Math.pow(10, decimals))
  const shifted_num_string = shifted_num
  return Number(shifted_num_string)
}

export function calcExtraLogs(acctInfo: AccountInfo): number {
  console.log("calcExtraLogs",acctInfo)
  if(!acctInfo.amount) return 0
  const extraLogs = (acctInfo.amount - BigInt(acctInfo["min-balance"])) / BigInt(100000)
  return Number(extraLogs)
}

export const IPFS_ENDPOINT = "https://ipfs.algonode.xyz/ipfs"

export async function ipfsFromAsset(asset: BonfireAssetData): Promise<string> {
  if (!asset.url) return ""
  try {
    const optimizer = "?optimizer=image&width=24&quality=70"
    if (asset.reserve && asset.url.includes("template-ipfs")) {
      const { data, cid } = await getARC19AssetData(asset.url, asset.reserve)
      const url = data.image ? data.image : `${IPFS_ENDPOINT}/${cid}${optimizer}`
      if (url.startsWith("ipfs://")) {
        const srcUrl = `${IPFS_ENDPOINT}/${url.slice(7)}${optimizer}`
        // console.debug("srcUrl1: ", srcUrl)
        return srcUrl
      }
      if (url !== "") {
        const srcUrl = url
        // console.debug("srcUrl2: ", srcUrl)
        return srcUrl
      }
      return ""
    }
    if (asset.url.endsWith("#arc3")) {
      const url = asset.url.slice(0, -5)
      if (url.startsWith("ipfs://")) {
        const response = await axios.get(`${IPFS_ENDPOINT}/${url.slice(7)}`)
        if (response.data.image.startsWith("ipfs://")) {
          const srcUrl = `${IPFS_ENDPOINT}/${response.data.image.slice(7)}${optimizer}`
          // console.debug("srcUrl3: ", srcUrl)
          return srcUrl
        }
        const srcUrl = response.data.image
        // console.debug("srcUrl4: ", srcUrl)
        return srcUrl
      } else {
        const response = await axios.get(url)
        if (response.data.image.startsWith("ipfs://")) {
          const srcUrl = `${IPFS_ENDPOINT}/${response.data.image.slice(7)}${optimizer}`
          // console.debug("srcUrl5: ", srcUrl)
          return srcUrl
        }
        const srcUrl = response.data.image
        // console.debug("srcUrl6: ", srcUrl)
        return srcUrl
      }
    }
    if (asset.url.startsWith("https://") && asset.url.includes("ipfs")) {
      const srcUrl = `${IPFS_ENDPOINT}/${asset.url.split("/ipfs/")[1]}${optimizer}`
      // console.debug("srcUrl7: ", srcUrl)
      return srcUrl
    }
    if (asset.url.startsWith("ipfs://")) {
      const srcUrl = `${IPFS_ENDPOINT}/${asset.url.slice(7)}${optimizer}`
      // console.debug("srcUrl8: ", srcUrl)
      return srcUrl
    }
    const srcUrl = asset.url
    // console.debug("srcUrl9: ", srcUrl)
    return srcUrl
  } catch (error) {
    console.error("Error fetching IPFS data: ", error)
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
