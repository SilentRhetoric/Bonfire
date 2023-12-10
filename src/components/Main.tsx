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
import { calcExtraLogs, ellipseString, makeIntegerAmount } from "../lib/utilities"
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
  } = useBonfire
  const extraLogs = createMemo(() => calcExtraLogs(bonfireInfo()))
  const [numLogs, setNumLogs] = createSignal(0)

  // eslint-disable-next-line no-unused-vars
  async function burn() {
    setConfirmedTxn("")
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
      const group = bonfire().compose()

      for (let i = 0; i < assetsToBurn.length; i++) {
        const asset = assetsToBurn[i]
        if (bonfireInfo()?.assets.find((a) => a["asset-id"] === asset.id) === undefined) {
          console.debug("Adding app call to opt Bonfire into ASA ", asset.id)
          group.arc54OptIntoAsa(
            { asa: asset.id },
            { sendParams: { fee: new AlgoAmount({ microAlgos: suggestedParams.minFee * 2 }) } },
          )
          numOptInCalls = numOptInCalls + 1
          slots = slots + 1
        }

        const closeRemainder = async (asset: BonfireAssetData) => {
          if (makeIntegerAmount(asset.decimalAmount, asset) === asset.amount) {
            const { params } = await algodClient().getAssetByID(asset.id).do()
            // console.debug("Asset creator address: ", params.creator)
            // console.debug("Sender address: ", address())
            // console.debug("Creator addresses same?: ", params.creator === address())
            if (params.creator == address()) {
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
        group.addTransaction(axfer)
        slots = slots + 1
      }

      const numMBRPayments =
        numOptInCalls - Math.floor((bonfireInfo()!.amount - bonfireInfo()!["min-balance"]) / 100000)
      console.debug("numMBRPayments: ", numMBRPayments)

      if (numMBRPayments > 0) {
        const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
          from: address(),
          to: bonfireAddr(),
          amount: 100000 * numMBRPayments,
          suggestedParams,
        })
        group.addTransaction(payTxn)
      }

      console.debug(group)

      // Sign & send the transaction group
      const result = await group.execute()
      console.debug("Txn confirmed result: ", result)
      setConfirmedTxn(result.txIds[0])
    }
  }

  async function donateLogs() {
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
  }

  return (
    <main class="mb-auto">
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
                    <div class="flex gap-1">
                      <button
                        class="btn btn-ghost w-60 bg-gradient-to-l from-yellow-500 via-orange-500 to-red-500 text-black"
                        onClick={() => connectWallet(wallet)}
                      >
                        {wallet.image()}
                      </button>
                    </div>
                  )}
                </For>
              </div>
            }
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:gap-8">
              <div class="flex flex-col items-center gap-4">
                <div class="grid grid-cols-1 grid-rows-1 flex-col text-9xl">
                  <p class="fade-element col-start-1 row-start-1 -scale-x-100">🔥</p>
                  <p class="fade-element col-start-1 row-start-1">🔥</p>
                  <p>🪵</p>
                </div>
                <button
                  class="btn btn-ghost btn-outline btn-lg w-1/2"
                  onClick={() => burn()}
                  disabled={
                    activeWallet() === undefined || Object.entries(rowSelection()).length < 1
                  }
                  aria-label="Burn ASA"
                >
                  Burn
                </button>
                <Show
                  when={bonfireInfo()?.assets !== undefined}
                  fallback={null}
                >
                  <div class="flex flex-row gap-16">
                    <p>Extra Logs: {extraLogs()}</p>
                    <p>ASAshes: {bonfireInfo()?.assets.length}</p>
                  </div>
                </Show>
                <div class="flex flex-row items-center gap-2">
                  <input
                    class="input input-sm w-1/2 text-right"
                    type="number"
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
                    class="btn btn-ghost btn-sm m-1 w-1/2"
                    onClick={() => donateLogs()}
                    disabled={activeWallet() === undefined || numLogs() < 1}
                    name="Donate extra logs"
                  >
                    Donate Extra Logs
                  </button>
                </div>
                <Show
                  when={confirmedTxn().length > 0}
                  fallback={null}
                >
                  <button
                    class="btn btn-ghost btn-sm"
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
              <ASATable />
            </div>
          </Show>
        </Show>
      </div>
    </main>
  )
}
