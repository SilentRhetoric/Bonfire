import { For, Show } from "solid-js"
import { ellipseString } from "../lib/utilities"
import { useWallet, NetworkId } from "@txnlab/use-wallet-solid"

type HeaderProps = {
  infoOpen: boolean
  setInfoOpen: (open: boolean) => void
}

export default function Header(props: HeaderProps) {
  const { activeAddress, activeNetwork, setActiveNetwork, activeWallet, activeWalletAddresses } =
    useWallet()
  return (
    <div class="sticky top-0 z-50 flex flex-row items-center px-1 py-1 sm:p-2">
      <div class="flex items-end">
        <h1 class="ml-2 flex bg-gradient-to-l from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-2xl font-bold text-transparent min-[375px]:text-4xl">
          Bonfire
        </h1>
      </div>
      <div class="grow" />
      <div class="flex gap-1 sm:gap-2">
        <button
          class={props.infoOpen ? `btn btn-outline` : `btn btn-ghost`}
          name="information"
          onClick={() => props.setInfoOpen(!props.infoOpen)}
        >
          {props.infoOpen ? "Close" : "About"}
        </button>
        <div class="dropdown dropdown-end dropdown-bottom">
          <div
            class="btn btn-ghost"
            tabindex={0}
            role="button"
          >
            {activeNetwork()[0].toUpperCase()}
          </div>
          <ul
            tabIndex={0}
            class="menu dropdown-content z-[2] rounded-box bg-base-100 p-2"
          >
            <For
              each={Object.values(NetworkId).filter(
                (n) => n == "mainnet" || n == "testnet" || n == "betanet",
              )}
            >
              {(network) => (
                <li>
                  <button
                    value={network}
                    onClick={() => setActiveNetwork(network)}
                  >
                    {network.charAt(0).toUpperCase() + network.substring(1).toLowerCase()}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
        <Show when={activeWallet() !== null && activeAddress()}>
          <div class="dropdown dropdown-end dropdown-bottom">
            <div
              class="btn btn-ghost"
              tabindex={0}
              role="button"
            >
              {ellipseString(activeAddress())}
            </div>
            <ul
              tabIndex={0}
              class="menu dropdown-content z-[2] rounded-box bg-base-100 p-2"
            >
              <For each={activeWalletAddresses()}>
                {(addr) => (
                  <li>
                    <div onClick={() => activeWallet()!.setActiveAccount(addr)}>
                      {ellipseString(addr)}
                    </div>
                  </li>
                )}
              </For>
              <li>
                <div
                  onClick={() => activeWallet()!.disconnect()}
                  aria-label="Disconnect"
                >
                  Disconnect
                </div>
              </li>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  )
}
