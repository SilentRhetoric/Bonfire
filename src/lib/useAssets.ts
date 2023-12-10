import { createComputed, createRoot, on } from "solid-js"
import { UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { BonfireAssetData } from "./types"
import { numberToDecimal } from "./utilities"
import { createStore } from "solid-js/store"

// The numbers in this type may need to be converted to BigInt in the library
export function makeAlgoAssetDataObj(amt: number): BonfireAssetData {
  return {
    id: 0,
    amount: amt,
    frozen: false,
    decimals: 6,
    name: "ALGO",
    unitName: "ALGO",
    total: 10000000000000000,
    decimalAmount: numberToDecimal(amt, 6),
  }
}

function useAssets() {
  const [accountAssets, setAccountAssets] = createStore<BonfireAssetData[]>([
    makeAlgoAssetDataObj(0),
  ])

  // Use reactive roots to compose app state
  const { address } = UseSolidAlgoWallets
  const { algodClient, getAccountInfo } = UseNetwork

  async function fetchAccountInfo() {
    // console.debug("fetchAccountInfo")
    const addr = address()
    // console.debug("addr: ", addr)
    if (addr) {
      // console.debug("walletClient: ", client)
      try {
        const info = await getAccountInfo(addr)
        // console.debug(info)
        const algoAssetEntry = makeAlgoAssetDataObj(info.amount)
        const assetsFromRes = info.assets
        // console.debug("Assets from response", assetsFromRes)
        // Reshape the asset data from the account info slightly
        const assets: BonfireAssetData[] = [
          algoAssetEntry,
          ...assetsFromRes.map(({ "asset-id": id, amount, "is-frozen": frozen }) => ({
            id: Number(id),
            // idString: id.toString(),
            amount,
            frozen,
            decimals: 0,
            total: 0,
            decimalAmount: 0,
          })),
        ]
        await Promise.all(
          assets.map(async (asset) => {
            if (asset.id > 0) {
              // console.debug("Asset before: ", JSON.stringify(asset))
              const { params } = await algodClient().getAssetByID(asset.id).do()
              // asset.idString = asset.id.toString()
              asset.name = params.name
              asset.unitName = params["unit-name"]
              asset.decimals = params.decimals
              asset.total = params.total
              asset.decimalAmount = numberToDecimal(asset.amount, params.decimals)
              // console.debug("Asset after: ", JSON.stringify(asset))
            }
          }),
        )
        console.debug("Assets array: ", assets)
        setAccountAssets(assets)
      } catch (e) {
        setAccountAssets([makeAlgoAssetDataObj(0)])
        console.error("Error fetching account assets: ", e)
      }
    }
  }

  createComputed(
    on(
      [address, algodClient],
      async () => {
        // console.debug("address or algodClient changed")
        if (address() === "") {
          setAccountAssets([makeAlgoAssetDataObj(0)])
        } else {
          await fetchAccountInfo()
        }
      },
      { defer: true },
    ),
  )

  createComputed(() => console.debug("Store updated: ", ...accountAssets))

  return {
    accountAssets,
    setAccountAssets,
  }
}
export default createRoot(useAssets)
