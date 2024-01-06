import { createComputed, createMemo, createRoot, createSignal, on } from "solid-js"
import { AccountInfo, UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { BonfireAssetData } from "./types"
import { calcExtraLogs, makeIntegerAmount, numberToDecimal } from "./utilities"
import { createStore } from "solid-js/store"
import { SortingState } from "@tanstack/solid-table"
import { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account"
import { Arc54Client } from "./Arc54Client"
import { getApplicationAddress } from "algosdk"
import { AppDetails } from "@algorandfoundation/algokit-utils/types/app-client"

export const BONFIRE_APP_IDS = {
  MainNet: 1305959747,
  TestNet: 497806551,
  BetaNet: 2019020358,
  LocalNet: 1011,
}

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
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [rowSelection, setRowSelection] = createSignal({})
  const [confirmedTxn, setConfirmedTxn] = createSignal("")

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
              // console.debug("params: ", params)
              asset.name = params.name
              asset.unitName = params["unit-name"]
              asset.decimals = params.decimals
              asset.total = params.total
              asset.decimalAmount = numberToDecimal(asset.amount, params.decimals)
              asset.creator = params.creator
              asset.reserve = params.reserve
              asset.url = params.url
              // console.debug("Asset after: ", JSON.stringify(asset))
            }
          }),
        )
        // await Promise.all(
        //   assets.map(async (asset) => {
        //     if (asset.id > 0) {
        //       asset.imageSrc = await ipfsFromAsset(asset)
        //     }
        //   }),
        // ),
        // console.debug("Assets array: ", assets)
        setAccountAssets(assets)

        //Get Bonfire app info
        const bonfireInfo = await algodClient().accountInformation(bonfireAddr()).do()
        // console.debug("bonfireInfo: ", bonfireInfo)
        setBonfireInfo(bonfireInfo as AccountInfo)
      } catch (e) {
        setAccountAssets([makeAlgoAssetDataObj(0)])
        console.error("Error fetching account info: ", e)
      }
    }
  }

  async function getBonfireInfo() {
    try {
      const bonfireInfo = await algodClient().accountInformation(bonfireAddr()).do()
      // console.debug("bonfireInfo: ", bonfireInfo)
      setBonfireInfo(bonfireInfo as AccountInfo)
    } catch (e) {
      console.error("Error fetching Bonfire info: ", e)
    }
  }

  const transactionSignerAccount = createMemo<TransactionSignerAccount>(() => ({
    addr: address(),
    signer: transactionSigner,
  }))

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
          await getBonfireInfo()
          setRowSelection({})
          setAccountAssets([makeAlgoAssetDataObj(0)])
          return
        } else {
          setRowSelection({})
          await getBonfireInfo()
          await fetchAccountInfo()
        }
      },
      { defer: true },
    ),
  )

  const group = createMemo(() => {
    let numTxns = 0
    let numOptIns = 0
    let fees = 0
    let payment = 0
    let mbrReduction = 0

    if (Object.entries(rowSelection()).length > 0) {
      const assetsToBurn: BonfireAssetData[] = []
      Object.entries(rowSelection()).forEach(([k]) => {
        assetsToBurn.push(accountAssets[Number(k)])
      })

      for (let i = 0; i < assetsToBurn.length; i++) {
        numTxns = numTxns + 1
        fees = fees + 1000
        const asset = assetsToBurn[i]

        if (bonfireInfo()?.assets.find((a) => a["asset-id"] === asset.id) === undefined) {
          fees = fees + 2000
          numTxns = numTxns + 1
          numOptIns = numOptIns + 1
        }

        if (makeIntegerAmount(asset.decimalAmount, asset) === asset.amount) {
          if (asset.creator !== address()) {
            mbrReduction = mbrReduction + 100000
          }
        }
      }
      const extraLogs = calcExtraLogs(bonfireInfo())
      const numMBRPayments = Math.max(numOptIns - extraLogs, 0)
      // console.debug(extraLogs, numMBRPayments)
      if (numMBRPayments > 0) {
        payment = payment + numMBRPayments * 100000
        numTxns = numTxns + 1
      }
    }
    const net = mbrReduction - payment - fees

    const groupObj = {
      numTxns,
      numOptIns,
      fees,
      payment,
      mbrReduction,
      net,
    }
    return groupObj
  })

  const groupFull = createMemo(() => {
    if (group()?.numTxns == 16) {
      return true
    } else if (group()?.payment + group()?.fees >= algoBalance()) {
      return true
    } else return false
  })
  const groupOverFull = createMemo(() => {
    if (group().numTxns > 16) {
      return true
    } else if (group().payment + group().fees > algoBalance()) {
      return true
    } else return false
  })

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
    getBonfireInfo,
    fetchAccountInfo,
    infoOpen,
    setInfoOpen,
    group,
    groupFull,
    groupOverFull,
  }
}
export default createRoot(useBonfire)
