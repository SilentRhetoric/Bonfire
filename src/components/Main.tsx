import { useWallet } from "@txnlab/use-wallet-solid"
import { For, Show, createComputed, createMemo, createSignal, on } from "solid-js"
import { AccountInfo, BonfireAssetData } from "../lib/types"
import {
  AtomicTransactionComposer,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
  getApplicationAddress,
} from "algosdk"
import { getTransactionWithSigner } from "@algorandfoundation/algokit-utils"
import { ASATable } from "./ASATable"
import { bigintToDecimal, calcExtraLogs, ellipseString, makeBigIntAmount, numberToDecimal } from "../lib/utilities"
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount"
import About from "./About"
import { AlloIcon } from "./Icons"
import { BONFIRE_APP_IDS, getAppUrl, getTxUrl } from "../lib/networks"
import { Arc54Client } from "../lib/Arc54Client"
import { createStore } from "solid-js/store"
import { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account"
import { AppDetails } from "@algorandfoundation/algokit-utils/types/app-client"
import { RateLimiter } from "limiter"
import { RowSelectionState } from "@tanstack/solid-table"
import { walletAssets } from "./WalletAssets"

type MainProps = {
  infoOpen: boolean
}

export default function Main(props: MainProps) {
  const { activeAddress, activeNetwork, transactionSigner, wallets, algodClient } = useWallet()

  // const activeAddress = () => "O2ZPSV6NJC32ZXQ7PZ5ID6PXRKAWQE2XWFZK5NK3UFULPZT6OKIOROEAPU" // Many-ASA acct for stress testing
  const [algoBalance, setAlgoBalance] = createSignal<bigint>(0)
  const [accountAssets, setAccountAssets] = createStore<BonfireAssetData[]>([])
  const [bonfireInfo, setBonfireInfo] = createSignal({
    address: "",
    amount: BigInt(0),
    assets: [],
    "min-balance": 0} as AccountInfo)
  const [rowSelection, setRowSelection] = createSignal<RowSelectionState>({})
  const [confirmedTxn, setConfirmedTxn] = createSignal("")
  const [loadingAccountInfo, setLoadingAccountInfo] = createSignal(false)
  const [numAssets, setNumAssets] = createSignal(0)
  const [numAssetsLoaded, setNumAssetsLoaded] = createSignal(0)
  const extraLogs = createMemo(() => calcExtraLogs(bonfireInfo()))
  const [numLogs, setNumLogs] = createSignal(0)
  const [waitingBurn, setWaitingBurn] = createSignal(false)
  const [waitingDonate, setWaitingDonate] = createSignal(false)

  const bonfireAppId = createMemo(() => BONFIRE_APP_IDS[activeNetwork()])
  const bonfireAddr = createMemo(() => getApplicationAddress(BONFIRE_APP_IDS[activeNetwork()]))
  const transactionSignerAccount = createMemo<TransactionSignerAccount>(() => ({
    addr: activeAddress()!,
    signer: transactionSigner,
  }))

  // TODO: Use useWallet algodClient
  // const algodClient = createMemo(() => {
  // const config = networkConfigs[activeNetwork()]
  // const token = config.algodToken ? config.algodToken : ""
  // const server = config.algodServer ? config.algodServer : ""
  // const port = config.algodPort ? config.algodPort : ""
  // return new Algodv2(token, server, port)
  // })

  const appDetails = createMemo<AppDetails>(() => {
    return {
      sender: transactionSignerAccount(),
      resolveBy: "id",
      id: bonfireAppId(),
    }
  })

  async function fetchAccountInfo() {
    // Get connected address info
    // console.debug("fetchAccountInfo")

    // Set loading state
    setLoadingAccountInfo(true)
    setNumAssetsLoaded(0)

    const addr = activeAddress()
    // console.debug("addr: ", addr)
    if (addr) {
      // console.debug("walletClient: ", client)
      try {
        const info = (await algodClient().accountInformation(addr).do()) as AccountInfo
        // console.debug("info: ", info)
        // setAccountInfo(info)
        setAlgoBalance(info.amount)
        const assetsFromRes = info.assets
        setNumAssets(assetsFromRes.length)
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

        // Throttle API requests to to kind to Urtho's free API
        const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 20 })
        await Promise.all(
          // eslint-disable-next-line solid/reactivity
          assets.map(async (asset) => {
            if (asset.id > 0) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const remainingRequests = await limiter.removeTokens(1)
                // console.debug("Asset before: ", JSON.stringify(asset))
                const { params } = await algodClient().getAssetByID(asset.id).do()
                // console.debug("params: ", params)
                asset.name = params.name
                asset.unitName = params["unit-name"]
                asset.decimals = params.decimals
                asset.total = BigInt(params.total)
                asset.decimalAmount = bigintToDecimal(asset.amount, params.decimals)
                asset.creator = params.creator
                asset.reserve = params.reserve
                asset.url = params.url
                // console.debug("Asset after: ", JSON.stringify(asset))
              } catch (e) {
                console.error(`Error fetching asset ${asset.id} info: `, e)
                asset.name = "[Deleted Asset]"
                asset.unitName = "N/A"
              }
              setNumAssetsLoaded((n) => n + 1)
            }
          }),
        )

        // console.debug("Assets array: ", assets)
        setAccountAssets(assets)
        setLoadingAccountInfo(false)
      } catch (e) {
        setAlgoBalance(BigInt(0))
        setAccountAssets([])
        console.error("Error fetching account info: ", e)
        setLoadingAccountInfo(false)
        setNumAssets(0)
        setNumAssetsLoaded(0)
      }
    }
  }

  const getBonfireInfo = async () => {
    console.debug("getBonfireInfo")
    try {
      // console.debug("algodClient3: ", JSON.stringify(algodClient()))
      const client = algodClient()
      const bonfireInfo = await client.accountInformation(bonfireAddr()).do()
      console.debug("bonfireInfo: ", bonfireInfo)
      bonfireInfo.amount = BigInt(bonfireInfo.amount)
      setBonfireInfo(bonfireInfo as AccountInfo)
    } catch (e) {
      console.error("Error fetching Bonfire info: ", e)
    }
  }

  createComputed(
    on(
      [activeAddress, activeNetwork, confirmedTxn],
      async () => {
        // console.debug("algodClient2: ", JSON.stringify(algodClient()))

        if (activeAddress() === null) {
          await getBonfireInfo()
          setRowSelection({})
          setAlgoBalance(BigInt(0))
          setAccountAssets([])
          return
        } else {
          await getBonfireInfo()
          setRowSelection({})
          await fetchAccountInfo()
        }
      },
      { defer: false },
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
        const assetToBurn = assetsToBurn[i]

        if (
          assetToBurn.amount > 0 && // This also handles deleted assets :)
          bonfireInfo()?.assets.find((a) => a["asset-id"] === assetToBurn.id) === undefined
        ) {
          fees = fees + 2000
          numTxns = numTxns + 1
          numOptIns = numOptIns + 1
        }

        if (makeBigIntAmount(assetToBurn.decimalAmount, assetToBurn) === assetToBurn.amount) {
          if (assetToBurn.creator !== activeAddress()) {
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

  const groupOverFull = createMemo(() => {
    if (group().numTxns > 16) {
      return true
    } else if (group().payment + group().fees > algoBalance()) {
      return true
    } else return false
  })

  createComputed(() => {
    // console.debug("activeAddress is null, resetting: ", activeAddress())
    if (activeAddress() == null) {
      setWaitingBurn(false)
      setWaitingDonate(false)
      setConfirmedTxn("")
    }
  })

  async function burn() {
    setWaitingBurn(true)
    // setConfirmedTxn("") // May not need to do this

    try {
      const bonfireClient = new Arc54Client(appDetails(), algodClient())
      const suggestedParams = await algodClient().getTransactionParams().do()
      suggestedParams.flatFee = true
      suggestedParams.fee = suggestedParams.minFee
      // console.debug("suggestedParams: ", suggestedParams)

      // console.debug("rowSelection: ", rowSelection())
      const assetsToBurn: BonfireAssetData[] = []
      Object.entries(rowSelection()).forEach(([k]) => {
        assetsToBurn.push(accountAssets[Number(k)])
      })
      // console.debug("assetsToBurn: ", JSON.stringify(assetsToBurn))

      if (assetsToBurn.length > 0) {
        let slots = 0
        let numOptInCalls = 0
        const optInAssets = []
        const axfers = []
        const group = bonfireClient.compose()

        for (let i = 0; i < assetsToBurn.length; i++) {
          const assetToBurn = assetsToBurn[i]
          if (
            assetToBurn.amount > 0 && // This also handles deleted assets :)
            bonfireInfo()?.assets.find((a) => a["asset-id"] === assetToBurn.id) === undefined
          ) {
            optInAssets.push(assetToBurn.id)
            numOptInCalls = numOptInCalls + 1
            slots = slots + 1
          }

          const closeRemainder = async (asset: BonfireAssetData) => {
            if (makeBigIntAmount(asset.decimalAmount, asset) === asset.amount) {
              if (asset.creator == activeAddress()) {
                return undefined
              } else return bonfireAddr()
            } else return undefined
          }
          const closeRemainderAddr = await closeRemainder(assetToBurn)
          // console.debug("closeRemainderAddr: ", closeRemainderAddr)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const axferObj: any = {
            from: activeAddress()!,
            to: bonfireAddr(),
            assetIndex: assetToBurn.id,
            amount: makeBigIntAmount(assetToBurn.decimalAmount, assetToBurn),
            suggestedParams,
          }
          if (closeRemainderAddr) {
            axferObj.closeRemainderTo = closeRemainderAddr
          }
          const axfer = makeAssetTransferTxnWithSuggestedParamsFromObject(axferObj)
          // console.debug("axfer: ", axfer)
          axfers.push(axfer)
          slots = slots + 1
        }

        const extraLogs = calcExtraLogs(bonfireInfo())

        const numMBRPayments = Math.max(numOptInCalls - extraLogs, 0)
        // console.debug("numMBRPayments: ", numMBRPayments)

        if (numMBRPayments > 0) {
          const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress()!,
            to: bonfireAddr(),
            amount: 100000 * numMBRPayments,
            suggestedParams,
          })
          // console.debug("payTxn: ", payTxn)
          group.addTransaction(payTxn)
        }

        // Now add optIn calls after payment is made to the contract account
        optInAssets.forEach((id) =>
          group.arc54OptIntoAsa(
            { asa: id },
            { sendParams: { fee: new AlgoAmount({ microAlgos: suggestedParams.minFee * 2 }) } },
          ),
        )

        // Now add asset transfers after the optIn calls
        axfers.forEach((txn) => {
          group.addTransaction(txn)
        })
        // console.debug("group: ", group)

        // Sign & send the transaction group
        const result = await group.execute()
        // console.debug("Txn confirmed result: ", result)
        setConfirmedTxn(result.txIds[0])
        setWaitingBurn(false)
      }
    } catch (e) {
      console.error("Error sending transaction: ", e)
      setWaitingBurn(false)
    }
  }

  async function donateLogs() {
    setWaitingDonate(true)
    setConfirmedTxn("")
    try {
      const suggestedParams = await algodClient().getTransactionParams().do()

      const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAddress()!,
        to: bonfireAddr(),
        amount: 100000 * numLogs(),
        suggestedParams,
      })
      const txn = await getTransactionWithSigner(payTxn, transactionSignerAccount())

      const atc = new AtomicTransactionComposer()
      atc.addTransaction(txn)
      const result = await atc.execute(algodClient(), 4)
      // console.debug("Txn confirmed: ", result)
      setConfirmedTxn(result.txIDs[0])
      setWaitingDonate(false)
    } catch (e) {
      console.error("Error sending transaction: ", e)
      setWaitingDonate(false)
    }
  }

  return (
    <main class="mb-auto flex min-h-[calc(100vh-234px)] flex-col items-center justify-start p-4">
      <Show
        when={!props.infoOpen}
        fallback={<About />}
      >
        <div class="flex flex-col gap-4 md:flex-row md:gap-8">
          <div class="flex flex-col items-center gap-2 md:w-1/3">
            <div class="grid grid-cols-1 grid-rows-1 flex-col pt-2 text-9xl">
              <p class="fade-element col-start-1 row-start-1 -scale-x-100">🔥</p>
              <p class="fade-element col-start-1 row-start-1">🔥</p>
              <p>🪵</p>
            </div>
            <button
              class="btn btn-ghost w-1/3 enabled:bg-gradient-to-r enabled:from-red-500 enabled:via-orange-500 enabled:to-yellow-500 enabled:text-black"
              onClick={() => burn()}
              disabled={
                activeAddress() === null ||
                Object.entries(rowSelection()).length < 1 ||
                groupOverFull()
              }
              name="Burn"
            >
              <Show
                when={waitingBurn()}
                fallback="Burn"
              >
                <span class="loading loading-dots" />
              </Show>
            </button>
            <div class="flex flex-row justify-evenly gap-4 whitespace-nowrap text-sm">
              <p>Extra Logs: {extraLogs()}</p>
              <a
                href={getAppUrl(bonfireAppId(), activeNetwork())}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View app details"
              >
                ASAshes: {bonfireInfo()?.assets?.length}
              </a>
            </div>
            <div class="flex flex-row items-center justify-center gap-2">
              <input
                class="input input-sm w-24 text-right text-sm"
                type="number"
                min={0}
                name="Number of logs"
                aria-label="Number of logs"
                value={numLogs()}
                onChange={(
                  e: Event & {
                    currentTarget: HTMLInputElement
                    target: HTMLInputElement
                  },
                ) => {
                  setNumLogs(Number(e.target.value))
                }}
              />
              <button
                class="btn btn-ghost btn-sm w-36 text-sm"
                onClick={() => donateLogs()}
                disabled={activeAddress() === null || numLogs() < 1}
                name="Add logs"
              >
                <Show
                  when={waitingDonate()}
                  fallback="Add Logs x 0.1A"
                >
                  <span class="loading loading-dots" />
                </Show>
              </button>
            </div>
            <Show
              when={confirmedTxn().length > 0}
              fallback={null}
            >
              <a
                href={getTxUrl(confirmedTxn(), activeNetwork())}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View transaction"
              >
                <button
                  class="w-66 btn btn-ghost btn-sm"
                  disabled={confirmedTxn().length === 0}
                >
                  View Prev. Txn
                  <Show when={activeNetwork() === "mainnet"}>
                    <AlloIcon />
                  </Show>
                </button>
              </a>
            </Show>
          </div>
          <Show
            when={activeAddress() !== null}
            fallback={
              <div class="flex flex-col items-center gap-2 md:w-2/3">
                <h2 class="text-center text-2xl">Connect Your Wallet</h2>
                <div class="flex flex-col gap-1">
                  <For each={wallets}>
                    {(wallet) => (
                      <button
                        class="btn w-60 bg-base-content bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-black"
                        onClick={() => wallet.connect()}
                      >
                        {walletAssets[wallet.metadata.name].image()}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            }
          >
            <div class="flex flex-col items-center gap-2 md:w-2/3">
              <h2 class="text-center text-2xl">
                Burnable Assets in {ellipseString(activeAddress())}
              </h2>
              <Show
                when={!loadingAccountInfo()}
                fallback={
                  <div class="flex h-64 w-64 flex-col items-center justify-center gap-8 p-8">
                    <p class="w-64 text-center text-sm italic">
                      Loading asset data at a rate that is gentle on{" "}
                      <a
                        href="https://nodely.io/docs/free/start"
                        target="_blank"
                        aria-label="Nodely free API"
                      >
                        Nodely's free API
                      </a>
                      ...
                    </p>
                    <p class="w-64 text-center text-sm italic">
                      Take a deep breath and remember that burning is irreversible.
                    </p>
                    <progress
                      class="progress-base-content progress"
                      value={numAssetsLoaded()}
                      max={numAssets()}
                    />
                  </div>
                }
              >
                <ASATable
                  accountAssets={accountAssets}
                  setAccountAssets={setAccountAssets}
                  rowSelection={rowSelection()}
                  setRowSelection={setRowSelection}
                  activeNetwork={activeNetwork()}
                />
              </Show>
              <div class="flex flex-row justify-center gap-1 text-xs">
                <p>Reduce MBR {numberToDecimal(group().mbrReduction, 6)}A</p>
                <p>-</p>
                <p>Burn Cost {numberToDecimal(group().fees + group().payment, 6)}A</p>
                <p>=</p>
                <p>{numberToDecimal(group().net, 6)}A Net</p>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </main>
  )
}
