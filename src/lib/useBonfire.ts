import { createComputed, createMemo, createResource, createRoot, createSignal, on } from "solid-js"
import { AccountInfo, UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { BonfireAssetData } from "./types"
import { numberToDecimal } from "./utilities"
import { createStore } from "solid-js/store"
import { SortingState } from "@tanstack/solid-table"
import { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account"
import { Arc54Client } from "./Arc54Client"
import { getApplicationAddress } from "algosdk"
import { AppDetails } from "@algorandfoundation/algokit-utils/types/app-client"

const APP_ID = 1011

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

function useBonfire() {
  const [algoBalance, setAlgoBalance] = createSignal(0)
  const [accountAssets, setAccountAssets] = createStore<BonfireAssetData[]>([])

  // Use reactive roots to compose app state
  const { address, transactionSigner } = UseSolidAlgoWallets
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
        setAlgoBalance(info.amount)
        const assetsFromRes = info.assets
        // console.debug("Assets from response", assetsFromRes)
        // Reshape the asset data from the account info slightly
        const assets: BonfireAssetData[] = [
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

  createComputed(() => console.debug("Store updated: ", ...accountAssets))

  const [sorting, setSorting] = createSignal<SortingState>([])
  const [rowSelection, setRowSelection] = createSignal({})
  // createComputed(() => console.debug(rowSelection()))

  const [confirmedTxn, setConfirmedTxn] = createSignal("")

  const transactionSignerAccount = createMemo<TransactionSignerAccount>(() => ({
    addr: address(),
    signer: transactionSigner,
  }))
  const appDetails = createMemo<AppDetails>(() => {
    return {
      sender: transactionSignerAccount(),
      resolveBy: "id",
      id: APP_ID,
    }
  })
  const bonfire = createMemo(() => new Arc54Client(appDetails(), algodClient()))
  const bonfireAddr = getApplicationAddress(APP_ID)

  async function getBonfireInfo(): Promise<AccountInfo> {
    const accountInfo = await algodClient().accountInformation(bonfireAddr).do()
    if (!accountInfo) {
      throw new Error("Unable to get account information")
    }
    console.debug(accountInfo)
    return accountInfo as AccountInfo
  }

  const [bonfireInfo, { refetch: refetchBonfireInfo }] = createResource(algodClient, getBonfireInfo)

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

  createComputed(
    on([confirmedTxn], async () => {
      fetchAccountInfo()
      refetchBonfireInfo()
    }),
  )

  return {
    APP_ID,
    bonfireAddr,
    algoBalance,
    setAlgoBalance,
    accountAssets,
    setAccountAssets,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    confirmedTxn,
    setConfirmedTxn,
    transactionSignerAccount,
    bonfire,
    bonfireInfo,
    refetchBonfireInfo,
    fetchAccountInfo,
  }
}
export default createRoot(useBonfire)
