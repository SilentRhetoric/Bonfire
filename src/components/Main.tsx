import { UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { For, Show, createComputed, createMemo, createSignal, onMount } from "solid-js"
import useBonfire from "../lib/useBonfire"
import {
  AtomicTransactionComposer,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from "algosdk"
import { getTransactionWithSigner } from "@algorandfoundation/algokit-utils"
import { ASATable } from "./ASATable"
import { calcExtraLogs, makeIntegerAmount, numberToDecimal } from "../lib/utilities"
import { BonfireAssetData } from "../lib/types"
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount"
import About from "./About"
import { AlloIcon } from "./Icons"

export default function Main() {
  onMount(() => reconnectWallet())
  onMount(() => getBonfireInfo())

  const { activeWallet, address, connectWallet, reconnectWallet, walletInterfaces } =
    UseSolidAlgoWallets
  const { algodClient, getAppUrl, getTxUrl, activeNetwork } = UseNetwork
  const {
    bonfireAppId,
    burnableAsas,
    rowSelection,
    bonfireAddr,
    bonfireClient,
    bonfireInfo,
    getBonfireInfo,
    confirmedTxn,
    setConfirmedTxn,
    transactionSignerAccount,
    infoOpen,
    group,
    groupOverFull,
    loadingAccountInfo,
    numAssets,
    numAssetsLoaded,
  } = useBonfire
  const extraLogs = createMemo(() => calcExtraLogs(bonfireInfo()))
  const [numLogs, setNumLogs] = createSignal(0)
  const [waitingBurn, setWaitingBurn] = createSignal(false)
  const [waitingDonate, setWaitingDonate] = createSignal(false)

  createComputed(() => {
    // console.debug("activeWallet: ", activeWallet())
    if (activeWallet() == undefined) {
      setWaitingBurn(false)
      setWaitingDonate(false)
      setConfirmedTxn("")
    }
  })

  async function burn() {
    setWaitingBurn(true)
    setConfirmedTxn("")

    try {
      const suggestedParams = await algodClient().getTransactionParams().do()
      suggestedParams.flatFee = true
      suggestedParams.fee = suggestedParams.minFee
      // console.debug("suggestedParams: ", suggestedParams)

      // console.debug("rowSelection: ", rowSelection())
      const assetsToBurn: BonfireAssetData[] = []
      Object.entries(rowSelection()).forEach(([k]) => {
        assetsToBurn.push(burnableAsas()[Number(k)])
      })
      // console.debug("assetsToBurn: ", JSON.stringify(assetsToBurn))

      if (assetsToBurn.length > 0) {
        let slots = 0
        let numOptInCalls = 0
        const optInAssets = []
        const axfers = []
        const group = bonfireClient().compose()

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
            if (makeIntegerAmount(asset.decimalAmount, asset) === asset.amount) {
              if (asset.creator == address()) {
                return undefined
              } else return bonfireAddr()
            } else return undefined
          }
          const closeRemainderAddr = await closeRemainder(assetToBurn)
          // console.debug("closeRemainderAddr: ", closeRemainderAddr)

          const axfer = makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: address(),
            to: bonfireAddr(),
            assetIndex: assetToBurn.id,
            amount: makeIntegerAmount(assetToBurn.decimalAmount, assetToBurn),
            closeRemainderTo: closeRemainderAddr,
            suggestedParams,
          })
          // console.debug("axfer: ", axfer.prettyPrint())
          axfers.push(axfer)
          slots = slots + 1
        }

        const extraLogs = calcExtraLogs(bonfireInfo())

        const numMBRPayments = Math.max(numOptInCalls - extraLogs, 0)
        // console.debug("numMBRPayments: ", numMBRPayments)

        if (numMBRPayments > 0) {
          const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
            from: address(),
            to: bonfireAddr(),
            amount: 100000 * numMBRPayments,
            suggestedParams,
          })
          // console.debug("payTxn: ", payTxn.prettyPrint())
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
        from: address(),
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
    <main class="mb-auto min-h-[calc(100vh-234px)] bg-gradient-to-b from-base-300 to-base-100">
      <div class="flex flex-col items-center justify-start p-4">
        <Show
          when={!infoOpen()}
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
                  activeWallet() === undefined ||
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
              <div class="flex flex-row justify-evenly gap-4 whitespace-nowrap">
                <p>Extra Logs: {extraLogs()}</p>
                <a
                  href={getAppUrl(bonfireAppId())}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View app details"
                >
                  ASAshes: {bonfireInfo()?.assets?.length}
                </a>
              </div>
              <div class="flex flex-row items-center justify-center gap-2">
                <input
                  class="input w-20 text-right"
                  type="number"
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
                  class="btn btn-ghost w-40"
                  onClick={() => donateLogs()}
                  disabled={activeWallet() === undefined || numLogs() < 1}
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
                  href={getTxUrl(confirmedTxn())}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View transaction"
                >
                  <button
                    class="w-66 btn btn-ghost"
                    disabled={confirmedTxn().length === 0}
                  >
                    View Transaction
                    <Show when={activeNetwork() === "MainNet"}>
                      <AlloIcon />
                    </Show>
                  </button>
                </a>
              </Show>
            </div>
            <Show
              when={activeWallet() !== undefined}
              fallback={
                <div class="flex flex-col items-center gap-2 md:w-2/3">
                  <h2 class="text-center text-2xl">Connect Your Wallet</h2>
                  <div class="flex flex-col gap-1">
                    <For each={Object.values(walletInterfaces)}>
                      {(wallet) => (
                        <button
                          class="btn w-60 bg-base-content bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-black"
                          onClick={() => connectWallet(wallet)}
                        >
                          {wallet.image()}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              }
            >
              <div class="flex flex-col items-center gap-2 md:w-2/3">
                <h2 class="text-center text-2xl">Your Burnable Assets</h2>
                <Show
                  when={!loadingAccountInfo()}
                  fallback={
                    <div class="flex h-64 w-64 flex-col items-center justify-center gap-8 p-8">
                      <p class="w-64 text-center text-sm italic">
                        Loading asset data at a rate that is gentle on AlgoNode's free API...
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
                  <ASATable />
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
      </div>
      {/* <div>
        <pre>{JSON.stringify(rowSelection(), null, 2)}</pre>
        <pre>{JSON.stringify(accountAssets, null, 2)}</pre>
      </div> */}
    </main>
  )
}
