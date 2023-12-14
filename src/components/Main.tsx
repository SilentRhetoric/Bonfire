import { UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { For, Show, createMemo, createSignal, onMount } from "solid-js"
import useBonfire from "../lib/useBonfire"
import {
  AtomicTransactionComposer,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from "algosdk"
import { getTransactionWithSigner } from "@algorandfoundation/algokit-utils"
import { ASATable } from "./ASATable"
import { calcExtraLogs, ellipseString, makeIntegerAmount, numberToDecimal } from "../lib/utilities"
import { BonfireAssetData } from "../lib/types"
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount"
import Info from "./Info"

export default function Main() {
  onMount(() => reconnectWallet())

  const { activeWallet, address, connectWallet, reconnectWallet, walletInterfaces } =
    UseSolidAlgoWallets
  const { algodClient, getTxUrl } = UseNetwork
  const {
    accountAssets,
    rowSelection,
    bonfireAddr,
    bonfire,
    bonfireInfo,
    confirmedTxn,
    setConfirmedTxn,
    transactionSignerAccount,
    infoOpen,
    group,
    groupOverFull,
  } = useBonfire
  const extraLogs = createMemo(() => calcExtraLogs(bonfireInfo()))
  const [numLogs, setNumLogs] = createSignal(0)
  const [waitingBurn, setWaitingBurn] = createSignal(false)
  const [waitingDonate, setWaitingDonate] = createSignal(false)

  // eslint-disable-next-line no-unused-vars
  async function burn() {
    setWaitingBurn(true)
    setConfirmedTxn("")

    try {
      const suggestedParams = await algodClient().getTransactionParams().do()
      suggestedParams.flatFee = true
      suggestedParams.fee = suggestedParams.minFee
      console.debug("suggestedParams: ", suggestedParams)

      console.debug("rowSelection: ", rowSelection())
      const assetsToBurn: BonfireAssetData[] = []
      Object.entries(rowSelection()).forEach(([k]) => {
        assetsToBurn.push(accountAssets[Number(k)])
      })
      console.debug("assetsToBurn: ", assetsToBurn)

      if (assetsToBurn.length > 0) {
        let slots = 0
        let numOptInCalls = 0
        const optInAssets = []
        const axfers = []
        const group = bonfire().compose()

        for (let i = 0; i < assetsToBurn.length; i++) {
          const asset = assetsToBurn[i]
          if (bonfireInfo()?.assets.find((a) => a["asset-id"] === asset.id) === undefined) {
            console.debug("Adding app call to opt Bonfire into ASA ", asset.id)
            // group.arc54OptIntoAsa(
            //   { asa: asset.id },
            //   { sendParams: { fee: new AlgoAmount({ microAlgos: suggestedParams.minFee * 2 }) } },
            // )
            optInAssets.push(asset.id)
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
          const closeRemainderAddr = await closeRemainder(asset)
          console.debug("closeRemainderAddr: ", closeRemainderAddr)

          const axfer = makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: address(),
            to: bonfireAddr(),
            assetIndex: asset.id,
            amount: makeIntegerAmount(asset.decimalAmount, asset),
            closeRemainderTo: closeRemainderAddr,
            suggestedParams,
          })
          console.debug("axfer: ", axfer.prettyPrint())
          axfers.push(axfer)
          // group.addTransaction(axfer)
          slots = slots + 1
        }

        const extraLogs = calcExtraLogs(bonfireInfo())

        const numMBRPayments = numOptInCalls - extraLogs
        console.debug("numMBRPayments: ", numMBRPayments)

        if (numMBRPayments > 0) {
          const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
            from: address(),
            to: bonfireAddr(),
            amount: 100000 * numMBRPayments,
            suggestedParams,
          })
          console.debug("payTxn: ", payTxn.prettyPrint())
          group.addTransaction(payTxn)
        }

        // Now add optIn calls after payment is made to the contract account
        optInAssets.forEach((id) =>
          group.arc54OptIntoAsa(
            { asa: id },
            { sendParams: { fee: new AlgoAmount({ microAlgos: suggestedParams.minFee * 2 }) } },
          ),
        )

        // Now add asset transfers
        axfers.forEach((txn) => {
          group.addTransaction(txn)
        })

        console.debug("Transaction group: ", group)

        // Sign & send the transaction group
        const result = await group.execute()
        console.debug("Txn confirmed result: ", result)
        setConfirmedTxn(result.txIds[0])
        setWaitingBurn(false)
      }
    } catch (e) {
      console.error("Error sending transaction: ", e)
    }
  }

  async function donateLogs() {
    setWaitingDonate(true)
    setConfirmedTxn("")
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
    console.debug("Txn confirmed: ", result)
    setConfirmedTxn(result.txIDs[0])
    setWaitingDonate(false)
  }

  return (
    <main class="mb-auto min-h-[calc(100vh-234px)] bg-gradient-to-b from-base-300 to-base-200">
      <div class="flex flex-col items-center justify-start p-4">
        <Show
          when={!infoOpen()}
          fallback={<Info />}
        >
          <Show
            when={activeWallet() !== undefined}
            fallback={
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
            }
          >
            <div class="flex flex-col gap-4 md:flex-row md:gap-8">
              <div class="flex flex-col items-center gap-2 md:w-1/2">
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
                    <span class="loading loading-spinner" />
                  </Show>
                </button>
                <Show
                  when={bonfireInfo()?.assets !== undefined}
                  fallback={null}
                >
                  <div class="flex flex-row justify-evenly gap-4">
                    <p>Extra Logs: {extraLogs()}</p>
                    <p>ASAshes: {bonfireInfo()?.assets.length}</p>
                  </div>
                </Show>
                <div class="flex flex-row items-center justify-center gap-4">
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
                    class="btn btn-ghost flex w-40 flex-row whitespace-nowrap"
                    onClick={() => donateLogs()}
                    disabled={activeWallet() === undefined || numLogs() < 1}
                    name="Donate logs"
                  >
                    Donate Logs x 0.1A
                    <Show when={waitingDonate()}>
                      <span class="loading loading-spinner" />
                    </Show>
                  </button>
                </div>
                <Show
                  when={confirmedTxn().length > 0}
                  fallback={null}
                >
                  <button
                    class="w-66 btn btn-ghost"
                    disabled={confirmedTxn().length === 0}
                  >
                    <a
                      href={getTxUrl(confirmedTxn())}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View transaction"
                    >
                      View Transaction: {confirmedTxn() && `${ellipseString(confirmedTxn(), 3)}`}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="ml-2 inline h-5 w-5"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                          clip-rule="evenodd"
                        />
                        <path
                          fill-rule="evenodd"
                          d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </a>
                  </button>
                </Show>
              </div>
              <div class="flex flex-col gap-2 md:w-1/2">
                <h2 class="text-center text-2xl">Your Burnable Assets</h2>
                <ASATable />
                <div class="flex flex-row justify-center gap-1 text-xs">
                  <p>Reduce MBR {numberToDecimal(group().mbrReduction, 6)}A</p>
                  <p>-</p>
                  <p>Burn Cost {numberToDecimal(group().fees + group().payment, 6)}A</p>
                  <p>=</p>
                  <p>{numberToDecimal(group().net, 6)}A Net</p>
                </div>
                {/* <div>{JSON.stringify(group())}</div> */}
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </main>
  )
}
