import { NetworkName, UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { onMount, type Component, Show, For, createSignal, createMemo } from "solid-js"
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
    <div class="flex min-h-screen flex-col items-center gap-10 p-10 text-center">
      <h1 class="text-4xl">🔥 Bonfire 🔥</h1>
      <p>
        Bonfire <span class="italic">can be</span> an interface for burning Algorand ASAs in a
        permissionless, verifiable, and standard way. Vote for xGov-86 if you want an easy way to
        "86" tokens the official way.
      </p>
      <a
        href="https://github.com/algorandfoundation/xGov/pull/86/files"
        target="_blank"
        class="btn"
      >
        xGov-86 Proposal
      </a>
      <p>
        It is critical to have a <span class="italic">single</span> ecosystem standard to enable
        explorers, DeFi metrics, and other tools in the ecosystem to subtract burned ASAs from
        measures of circulating supply. Read and comment on the draft standard ARC-54 to help
        finalize it.
      </p>
      <a
        href="https://github.com/algorandfoundation/ARCs/pull/245/files"
        target="_blank"
        class="btn"
      >
        ARC-54 Standard
      </a>
      <div class="flex-grow"></div>
      <a
        href="https://x.com/silentrhetoric"
        target="_blank"
        class="flex flex-row"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-6 w-6 fill-base-content"
        >
          <g>
            <path d="M14.258 10.152L23.176 0h-2.113l-7.747 8.813L7.133 0H0l9.352 13.328L0 23.973h2.113l8.176-9.309 6.531 9.309h7.133zm-2.895 3.293l-.949-1.328L2.875 1.56h3.246l6.086 8.523.945 1.328 7.91 11.078h-3.246zm0 0"></path>
          </g>
        </svg>
        <p class="ml-2">by SilentRhetoric</p>
      </a>
      <div class="flex h-screen flex-col items-center justify-start p-4 text-center">
        <select
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
        </select>
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
          <select
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
              {(acc) => <option value={acc.address}>{ellipseString(acc.address, 4)}</option>}
            </For>
          </select>
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
              View Transaction{confirmedTxn() && `: ${ellipseString(confirmedTxn())}`}
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
          <p>{JSON.stringify(accountAssets)}</p>
        </Show>
      </div>
    </div>
  )
}

export default App
