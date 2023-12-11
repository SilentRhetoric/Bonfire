import { type Component, ErrorBoundary } from "solid-js"

import Main from "./components/Main"
import Header from "./components/Header"
import Footer from "./components/Footer"

const App: Component = () => {
  return (
    <ErrorBoundary fallback={(err, reset) => <div onClick={reset}>Error: {err.toString()}</div>}>
      <div class="flex flex-col">
        <Header />
        <Main />
        <Footer />
      </div>
    </ErrorBoundary>
  )
}

export default App
