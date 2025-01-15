import { type Component, createSignal, ErrorBoundary } from "solid-js"

import Main from "./components/Main"
import Header from "./components/Header"
import Footer from "./components/Footer"
import { NetworkId, WalletId, WalletManager, WalletProvider } from "@txnlab/use-wallet-solid"

const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.EXODUS,
    {
      id: WalletId.WALLETCONNECT,
      options: { projectId: "d9cef016ef56cf53a72d549e5898f348" },
    },
    {
      id: WalletId.LUTE,
      options: { siteName: "Bonfire" },
    },
    // WalletId.KMD,
  ],
  network: NetworkId.MAINNET,
})

const App: Component = () => {
  const [infoOpen, setInfoOpen] = createSignal(false)

  return (
    <ErrorBoundary fallback={(err, reset) => <div onClick={reset}>Error: {err.toString()} <pre>{err.stack}</pre></div>}>
      <WalletProvider manager={walletManager}>
        <div class="flex flex-col bg-gradient-to-b from-neutral to-base-100">
          <Header
            infoOpen={infoOpen()}
            setInfoOpen={setInfoOpen}
          />
          <Main infoOpen={infoOpen()} />
          <Footer />
        </div>
      </WalletProvider>
    </ErrorBoundary>
  )
}

export default App
