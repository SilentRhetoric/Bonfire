import { UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import {
  onMount,
  type Component,
  Show,
  For,
  createSignal,
  createMemo,
  ErrorBoundary,
} from "solid-js"
import { ellipseString } from "./lib/utilities"
import { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account"
import {
  AtomicTransactionComposer,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from "algosdk"
import { getTransactionWithSigner } from "@algorandfoundation/algokit-utils"
import useAssets from "./lib/useAssets"
import { Arc54Client } from "./lib/Arc54Client"
import { AppDetails } from "@algorandfoundation/algokit-utils/types/app-client"
import { ASATable } from "./components/ASATable"
import { Footer } from "./components/Footer"
import Header from "./components/Header"

const App: Component = () => {
  const {
    activeWallet,
    walletName,
    address,
    setAddress,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    walletInterfaces,
    transactionSigner,
  } = UseSolidAlgoWallets
  const { algodClient, activeNetwork, setActiveNetwork, networkNames, getTxUrl } = UseNetwork
  onMount(() => reconnectWallet())
  const { accountAssets } = useAssets
  const [confirmedTxn, setConfirmedTxn] = createSignal("")

  const transactionSignerAccount = createMemo<TransactionSignerAccount>(() => ({
    addr: address(),
    signer: transactionSigner,
  }))
  const appDetails: AppDetails = {
    sender: transactionSignerAccount(),
    resolveBy: "id",
    id: 1062,
  }
  const appClient = new Arc54Client(appDetails, algodClient())

  async function burnAsa() {
    setConfirmedTxn("")
    const asaID = 1067
    const bonfireAddress = (await appClient.appClient.getAppReference()).appAddress
    const suggestedParams = await algodClient().getTransactionParams().do()
    suggestedParams.flatFee = true
    suggestedParams.fee = suggestedParams.minFee * 2
    const axfer = makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: address(),
      to: bonfireAddress,
      assetIndex: asaID,
      amount: 1,
      suggestedParams,
    })
    const args = { asa: asaID }
    const result = await appClient.compose().arc54OptIntoAsa(args).addTransaction(axfer).execute()
    console.log("Txn confirmed result: ", result)
    setConfirmedTxn(result.txIds[0])
  }

  async function sendTxn() {
    setConfirmedTxn("")
    const suggestedParams = await algodClient().getTransactionParams().do()

    const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: address(),
      to: address(),
      amount: 0,
      suggestedParams,
    })
    const txn = await getTransactionWithSigner(payTxn, transactionSignerAccount())

    const atc = new AtomicTransactionComposer()
    atc.addTransaction(txn)
    const result = await atc.execute(algodClient(), 4)
    console.log("Txn confirmed: ", result)
    setConfirmedTxn(result.txIDs[0])
  }

  return (
    <ErrorBoundary fallback={(err, reset) => <div onClick={reset}>Error: {err.toString()}</div>}>
      <div class="relative flex min-h-[calc(100vh-72px)] max-w-screen-xl flex-col bg-gradient-to-br from-base-200 to-base-100">
        <Header />
        <div class="flex h-screen flex-col items-center justify-start p-4 text-center">
          {/* <select
          class="select select-bordered m-1 max-w-xs"
          onChange={(e) => setActiveNetwork(e.target.value as NetworkName)}
          value={activeNetwork()}
        >
          <option
            disabled
            selected
          >
            Select Network
          </option>
          <For each={networkNames}>{(network) => <option value={network}>{network}</option>}</For>
        </select> */}
          <Show
            when={activeWallet() !== undefined}
            fallback={
              <div class="flex flex-col gap-1">
                <For each={Object.values(walletInterfaces)}>
                  {(wallet) => (
                    <div class="flex gap-1">
                      <button
                        class="btn btn-primary w-20"
                        onClick={() => connectWallet(wallet)}
                      >
                        {wallet.icon()}
                      </button>
                      <button
                        class="btn btn-primary w-60"
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
            <div class="dropdown">
              <div
                class="btn m-1"
                tabindex="0"
                role="button"
              >
                {activeNetwork()}
              </div>
              <ul class="menu dropdown-content z-[1] rounded-box bg-base-100 p-2 shadow">
                <For each={networkNames}>
                  {(network) => (
                    <li>
                      <button
                        value={network}
                        onClick={() => setActiveNetwork(network)}
                      >
                        {network}
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </div>
            {/* <select
            class="select select-bordered m-1 max-w-xs"
            onChange={(e) => setAddress(e.target.value)}
            value={address()}
          >
            <option
              disabled
              selected
            >
              Select Address
            </option>
            <For each={activeWallet().accounts()}>
              {(acc) => (
                <option
                  class="btn"
                  value={acc.address}
                >
                  {ellipseString(acc.address, 4)}
                </option>
              )}
            </For>
          </select> */}
            <div class="dropdown">
              <div
                class="btn m-1"
                tabindex={0}
                role="button"
              >
                {ellipseString(address(), 4)}
              </div>
              <ul
                tabIndex={0}
                class="menu dropdown-content z-[1] rounded-box bg-base-100 p-2 shadow"
              >
                <For each={activeWallet().accounts()}>
                  {(acc) => (
                    <li>
                      <a onClick={() => setAddress(acc.address)}>{ellipseString(acc.address, 4)}</a>
                    </li>
                  )}
                </For>
              </ul>
            </div>
            <p>Wallet Name: {walletName()}</p>
            <p>Address: {ellipseString(address())}</p>
            <p></p>
            <button
              class="btn m-1 w-60"
              onClick={() => sendTxn()}
              disabled={activeWallet() === undefined}
              aria-label="Send 0A transaction"
            >
              Send 0A Transaction
            </button>
            <button
              class="btn m-1 w-60"
              onClick={() => burnAsa()}
              disabled={activeWallet() === undefined}
              aria-label="Burn ASA"
            >
              Burn ASA
            </button>
            <button
              class="btn m-1 w-60"
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
            <button
              class="btn m-1 w-60"
              onClick={() => disconnectWallet()}
              disabled={activeWallet() === undefined}
              aria-label="Disconnect wallet"
            >
              Disconnect Wallet
            </button>
            <p>{JSON.stringify(accountAssets())}</p>
            <ASATable assets={accountAssets} />
          </Show>
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}

export default App
