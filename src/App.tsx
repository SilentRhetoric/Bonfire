import type { Component } from "solid-js"

const App: Component = () => {
  return (
    <div class="flex min-h-screen flex-col items-center gap-10 p-10 text-center">
      <h1 class="text-4xl">Bonfire 🔥</h1>
      <p>
        Bonfire <span class="italic">can be</span> an interface for for burning Algorand ASAs in a
        permissionless, verifiable, and standard way. Vote for xGov-86 if you want an easy way to
        "86" tokens the official way.
      </p>
      <a
        href="https://github.com/algorandfoundation/xGov/pull/86/files"
        target="_blank"
        class="btn btn-neutral"
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
        class="btn btn-neutral"
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
          class="fill-base-content h-6 w-6"
        >
          <g>
            <path d="M14.258 10.152L23.176 0h-2.113l-7.747 8.813L7.133 0H0l9.352 13.328L0 23.973h2.113l8.176-9.309 6.531 9.309h7.133zm-2.895 3.293l-.949-1.328L2.875 1.56h3.246l6.086 8.523.945 1.328 7.91 11.078h-3.246zm0 0"></path>
          </g>
        </svg>
        <p class="ml-2">by SilentRhetoric</p>
      </a>
    </div>
  )
}

export default App
