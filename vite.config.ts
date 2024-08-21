import { defineConfig } from "vite"
import solidPlugin from "vite-plugin-solid"

export default defineConfig({
  plugins: [solidPlugin()],
  optimizeDeps: {
    include: [
      '@perawallet/connect', 
      '@blockshake/defly-connect',
      '@walletconnect/modal',
      '@walletconnect/sign-client'
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
