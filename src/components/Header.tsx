import { UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { For, Show } from "solid-js"
import { ellipseString } from "../lib/utilities"

export default function Header() {
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
  return (
    <div class="flex flex-row items-center p-2">
      <div class="flex text-2xl md:text-4xl">
        <h1 class="flex">🔥</h1>
        <h1 class="ml-1 flex bg-gradient-to-r from-yellow-500 to-red-500 bg-clip-text font-bold text-transparent">
          Bonfire
        </h1>
      </div>

      <div class="grow"></div>
      <div class="flex gap-2">
        <Show when={activeWallet() !== undefined}>
          <div class="dropdown">
            <div
              class="btn"
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
          <div class="dropdown">
            <div
              class="btn"
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
              <li>
                <a
                  onClick={() => disconnectWallet()}
                  aria-label="Disconnect"
                >
                  Disconnect
                </a>
              </li>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  )
}
