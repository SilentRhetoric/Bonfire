import { type Component, ErrorBoundary } from "solid-js"

import Main from "./components/Main"
import Header from "./components/Header"
import Footer from "./components/Footer"

const App: Component = () => {
  return (
    <ErrorBoundary fallback={(err, reset) => <div onClick={reset}>Error: {err.toString()}</div>}>
      <div class="flex min-h-screen flex-col bg-gradient-to-b from-base-200 to-base-100">
        <Header />
        <Main />
        <Footer />
      </div>
    </ErrorBoundary>
  )
}

export default App
