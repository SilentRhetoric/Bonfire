import { UseNetwork, UseSolidAlgoWallets } from "solid-algo-wallets"
import { For, Show } from "solid-js"
import { ellipseString } from "../lib/utilities"
import useBonfire from "../lib/useBonfire"

export default function Header() {
  const { activeWallet, address, setAddress, disconnectWallet } = UseSolidAlgoWallets
  const { activeNetwork, setActiveNetwork, networkNames } = UseNetwork
  const { infoOpen, setInfoOpen } = useBonfire
  return (
    <div class="sticky top-0 z-50 flex flex-row items-center bg-base-300 px-1 py-1 sm:p-2">
      <div class="flex items-end">
        <h1 class="ml-2 flex bg-gradient-to-l from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-2xl font-bold text-transparent min-[375px]:text-4xl">
          Bonfire
        </h1>
        {/* <p class="text-xs">Beta</p> */}
      </div>
      <div class="grow" />
      <div class="flex gap-1 sm:gap-2">
        <button
          class={infoOpen() ? `btn btn-outline` : `btn btn-ghost`}
          name="information"
          onClick={() => setInfoOpen(!infoOpen())}
        >
          {infoOpen() ? "Close" : "About"}
        </button>
        <div class="dropdown dropdown-end dropdown-bottom">
          <div
            class="btn btn-ghost"
            tabindex="0"
            role="button"
          >
            {activeNetwork()[0]}
          </div>
          <ul class="menu dropdown-content z-[2] rounded-box bg-base-100 p-2">
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
        <Show when={activeWallet() !== undefined}>
          <div class="dropdown dropdown-end dropdown-bottom">
            <div
              class="btn btn-ghost"
              tabindex={0}
              role="button"
            >
              {ellipseString(address(), 3)}
            </div>
            <ul
              tabIndex={0}
              class="menu dropdown-content z-[2] rounded-box bg-base-100 p-2 shadow"
            >
              <For each={activeWallet()?.accounts()}>
                {(acc) => (
                  <li>
                    <div onClick={() => setAddress(acc.address)}>
                      {ellipseString(acc.address, 3)}
                    </div>
                  </li>
                )}
              </For>
              <li>
                <div
                  onClick={() => disconnectWallet()}
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
