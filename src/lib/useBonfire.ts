import { createComputed, createMemo, createRoot, createSignal, on } from "solid-js"
import { AccountInfo, UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { BonfireAssetData } from "./types"
import { numberToDecimal } from "./utilities"
import { createStore } from "solid-js/store"
import { SortingState } from "@tanstack/solid-table"
import { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account"
import { Arc54Client } from "./Arc54Client"
import { getApplicationAddress } from "algosdk"
import { AppDetails } from "@algorandfoundation/algokit-utils/types/app-client"

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
    creator: "",
  }
}

function useBonfire() {
  // Use reactive roots to compose app state
  const { address, transactionSigner } = UseSolidAlgoWallets
  const { algodClient, getAccountInfo, activeNetwork } = UseNetwork
  const [algoBalance, setAlgoBalance] = createSignal(0)
  const [accountAssets, setAccountAssets] = createStore<BonfireAssetData[]>([])
  const [accountInfo, setAccountInfo] = createStore({} as AccountInfo)
  const [bonfireInfo, setBonfireInfo] = createSignal({} as AccountInfo)
  const [infoOpen, setInfoOpen] = createSignal(false)

  const BONFIRE_APP_IDS = {
    MainNet: 0,
    TestNet: 0,
    BetaNet: 0,
    LocalNet: 1011,
  }

  console.debug(activeNetwork())
  const bonfireAddr = createMemo(() => getApplicationAddress(BONFIRE_APP_IDS[activeNetwork()]))

  async function fetchAccountInfo() {
    // Get connected address info
    // console.debug("fetchAccountInfo")
    const addr = address()
    // console.debug("addr: ", addr)
    if (addr) {
      // console.debug("walletClient: ", client)
      try {
        const info = await getAccountInfo(addr)
        // console.debug(info)
        setAccountInfo(info)
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
            creator: "",
          })),
        ]
        await Promise.all(
          assets.map(async (asset) => {
            if (asset.id > 0) {
              // console.debug("Asset before: ", JSON.stringify(asset))
              const { params } = await algodClient().getAssetByID(asset.id).do()
              asset.name = params.name
              asset.unitName = params["unit-name"]
              asset.decimals = params.decimals
              asset.total = params.total
              asset.decimalAmount = numberToDecimal(asset.amount, params.decimals)
              asset.creator = params.creator
              // console.debug("Asset after: ", JSON.stringify(asset))
            }
          }),
        )
        console.debug("Assets array: ", assets)
        setAccountAssets(assets)

        //Get Bonfire app info
        const bonfireInfo = await algodClient().accountInformation(bonfireAddr()).do()
        console.debug("bonfireInfo: ", bonfireInfo)
        setBonfireInfo(bonfireInfo as AccountInfo)
      } catch (e) {
        setAccountAssets([makeAlgoAssetDataObj(0)])
        console.error("Error fetching: ", e)
      }
    }
  }

  createComputed(() => console.debug("Store updated: ", ...accountAssets))

  const [sorting, setSorting] = createSignal<SortingState>([])
  const [rowSelection, setRowSelection] = createSignal({})

  const [confirmedTxn, setConfirmedTxn] = createSignal("")

  const transactionSignerAccount = createMemo<TransactionSignerAccount>(() => ({
    addr: address(),
    signer: transactionSigner,
  }))
  console.debug("appId: ", BONFIRE_APP_IDS[activeNetwork()])
  const appDetails = createMemo<AppDetails>(() => {
    return {
      sender: transactionSignerAccount(),
      resolveBy: "id",
      id: BONFIRE_APP_IDS[activeNetwork()],
    }
  })
  const bonfire = createMemo(() => new Arc54Client(appDetails(), algodClient()))

  createComputed(
    on(
      [address, algodClient, confirmedTxn, activeNetwork],
      async () => {
        if (address() === "") {
          setAccountAssets([makeAlgoAssetDataObj(0)])
          return
        } else {
          await fetchAccountInfo()
          setRowSelection({})
        }
      },
      { defer: true },
    ),
  )

  return {
    APP_IDS: BONFIRE_APP_IDS,
    bonfireAddr,
    algoBalance,
    setAlgoBalance,
    accountInfo,
    setAccountInfo,
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
    // refetchBonfireInfo,
    fetchAccountInfo,
    infoOpen,
    setInfoOpen,
  }
}
export default createRoot(useBonfire)
