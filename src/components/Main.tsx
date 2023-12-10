import { UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { For, Show, createMemo, createResource, createSignal, onMount } from "solid-js"
import useAssets from "../lib/useAssets"
import { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account"
import { AppDetails } from "@algorandfoundation/algokit-utils/types/app-client"
import { Arc54Client } from "../lib/Arc54Client"
import {
  AtomicTransactionComposer,
  getApplicationAddress,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from "algosdk"
import { getTransactionWithSigner } from "@algorandfoundation/algokit-utils"
import { ASATable } from "./ASATable"
import { ellipseString, makeIntegerAmount } from "../lib/utilities"
import { AccountInfo, BonfireAssetData } from "../lib/types"
import { RowSelectionState } from "@tanstack/solid-table"
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount"

const APP_ID = 1011

export default function Main() {
  const {
    activeWallet,
    address,
    connectWallet,
    reconnectWallet,
    walletInterfaces,
    transactionSigner,
  } = UseSolidAlgoWallets
  const { algodClient, getTxUrl } = UseNetwork
  onMount(() => reconnectWallet())
  const { accountAssets } = useAssets
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

  // eslint-disable-next-line no-unused-vars
  async function burn(selections: RowSelectionState) {
    setConfirmedTxn("")
    const bonfireAddress = (await bonfire().appClient.getAppReference()).appAddress
    const suggestedParams = await algodClient().getTransactionParams().do()
    suggestedParams.flatFee = true

    const assetsToBurn: BonfireAssetData[] = Object.entries(selections).map(([k]) => {
      return accountAssets[Number(k)]
    })

    let slots = 0
    let numOptInCalls = 0

    const atc = bonfire().compose()

    for (let i = 0; i < assetsToBurn.length; i++) {
      const asset = assetsToBurn[i]
      const axfer = makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: address(),
        to: bonfireAddress,
        assetIndex: asset.id,
        amount: makeIntegerAmount(asset.decimalAmount, asset),
        closeRemainderTo: bonfireAddr,
        suggestedParams,
      })
      atc.addTransaction(axfer)
      slots = slots + 1

      if (bonfireInfo()?.assets.find((a) => a["asset-id"] !== asset.id)) {
        atc.arc54OptIntoAsa(
          { asa: asset.id },
          { sendParams: { fee: new AlgoAmount({ microAlgos: suggestedParams.minFee * 2 }) } },
        )
        numOptInCalls = numOptInCalls + 1
        slots = slots + 1
      }
    }

    const numMBRPayments =
      Math.floor((bonfireInfo()!.amount - bonfireInfo()!["min-balance"]) / 100000) - numOptInCalls

    if (numMBRPayments > 0) {
      const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
        from: address(),
        to: bonfireAddr,
        amount: 100000 * numMBRPayments,
        suggestedParams,
      })
      atc.addTransaction(payTxn)
    }

    const result = await atc.execute()
    console.log("Txn confirmed result: ", result)
    setConfirmedTxn(result.txIds[0])
  }

  async function sendTxn() {
    setConfirmedTxn("")
    const suggestedParams = await algodClient().getTransactionParams().do()

    const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: address(),
      to: bonfireAddr,
      amount: 100000,
      suggestedParams,
    })
    const txn = await getTransactionWithSigner(payTxn, transactionSignerAccount())

    const atc = new AtomicTransactionComposer()
    atc.addTransaction(txn)
    const result = await atc.execute(algodClient(), 4)
    console.log("Txn confirmed: ", result)
    setConfirmedTxn(result.txIDs[0])
    refetchBonfireInfo()
  }
  return (
    <main class="mb-auto">
      <div class="flex flex-col items-center justify-start p-4 text-center">
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
          <div class="grid grid-cols-1 grid-rows-1 flex-col text-9xl">
            <p class="fade-element col-start-1 row-start-1 -scale-x-100">🔥</p>
            <p class="fade-element col-start-1 row-start-1">🔥</p>
            <p>🪵</p>
          </div>
          <Show when={bonfireInfo.state === "ready"}>
            <div class="flex flex-row gap-2">
              <p>
                Extra Logs:{" "}
                {Math.floor((bonfireInfo()!.amount - bonfireInfo()!["min-balance"]) / 100000)}
              </p>
              <p>ASAshes: {bonfireInfo()?.assets.length}</p>
            </div>
          </Show>
          <button
            class="btn"
            onClick={() => null}
            disabled={activeWallet() === undefined}
            aria-label="Burn ASA"
          >
            Burn 🔥
          </button>
          <Show when={accountAssets.length > 1}>
            <ASATable assets={accountAssets} />
          </Show>
        </Show>
      </div>
      {/* <div>{JSON.stringify(bonfireInfo())}</div> */}
      <button
        class="btn btn-ghost m-1 w-60"
        onClick={() => sendTxn()}
        disabled={activeWallet() === undefined}
        aria-label="Send 0A transaction"
      >
        Buy log for 0.1A
      </button>
      <Show
        when={confirmedTxn().length > 0}
        fallback={null}
      >
        <button
          class="btn btn-ghost"
          disabled={confirmedTxn().length === 0}
        >
          <a
            href={getTxUrl(confirmedTxn())}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View transaction"
          >
            View Transaction{confirmedTxn() && `: ${ellipseString(confirmedTxn(), 5)}`}
          </a>
        </button>
      </Show>
    </main>
  )
}
