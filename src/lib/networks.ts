import { NetworkId } from "@txnlab/use-wallet-solid"
import { NetworkConfig, NetworkConfigs, NetworkName } from "./types"

export const BONFIRE_APP_IDS = {
  mainnet: 1257620981, // Beta used 1305959747,
  testnet: 497806551,
  betanet: 2019020358,
  localnet: 1013,
}

const MAINNET_ALGOD_TOKEN = import.meta.env.VITE_MAINNET_ALGOD_TOKEN
const MAINNET_ALGOD_SERVER = import.meta.env.VITE_MAINNET_ALGOD_SERVER
const MAINNET_ALGOD_PORT = import.meta.env.VITE_MAINNET_ALGOD_PORT
const MAINNET_BLOCK_EXPLORER = import.meta.env.VITE_MAINNET_BLOCK_EXPLORER

const TESTNET_ALGOD_TOKEN = import.meta.env.VITE_TESTNET_ALGOD_TOKEN
const TESTNET_ALGOD_SERVER = import.meta.env.VITE_TESTNET_ALGOD_SERVER
const TESTNET_ALGOD_PORT = import.meta.env.VITE_TESTNET_ALGOD_PORT
const TESTNET_BLOCK_EXPLORER = import.meta.env.VITE_TESTNET_BLOCK_EXPLORER

const BETANET_ALGOD_TOKEN = import.meta.env.VITE_BETANET_ALGOD_TOKEN
const BETANET_ALGOD_SERVER = import.meta.env.VITE_BETANET_ALGOD_SERVER
const BETANET_ALGOD_PORT = import.meta.env.VITE_BETANET_ALGOD_PORT
const BETANET_BLOCK_EXPLORER = import.meta.env.VITE_BETANET_BLOCK_EXPLORER

const LOCALNET_ALGOD_TOKEN = import.meta.env.VITE_LOCALNET_ALGOD_TOKEN
const LOCALNET_ALGOD_SERVER = import.meta.env.VITE_LOCALNET_ALGOD_SERVER
const LOCALNET_ALGOD_PORT = import.meta.env.VITE_LOCALNET_ALGOD_PORT
const LOCALNET_BLOCK_EXPLORER = import.meta.env.VITE_LOCALNET_BLOCK_EXPLORER

const MAINNET_CONFIG: NetworkConfig = {
  algodToken: MAINNET_ALGOD_TOKEN,
  algodServer: MAINNET_ALGOD_SERVER,
  algodPort: MAINNET_ALGOD_PORT,
  blockExplorer: MAINNET_BLOCK_EXPLORER,
}
const TESTNET_CONFIG: NetworkConfig = {
  algodToken: TESTNET_ALGOD_TOKEN,
  algodServer: TESTNET_ALGOD_SERVER,
  algodPort: TESTNET_ALGOD_PORT,
  blockExplorer: TESTNET_BLOCK_EXPLORER,
}
const BETANET_CONFIG: NetworkConfig = {
  algodToken: BETANET_ALGOD_TOKEN,
  algodServer: BETANET_ALGOD_SERVER,
  algodPort: BETANET_ALGOD_PORT,
  blockExplorer: BETANET_BLOCK_EXPLORER,
}
const LOCALNET_CONFIG: NetworkConfig = {
  algodToken: LOCALNET_ALGOD_TOKEN,
  algodServer: LOCALNET_ALGOD_SERVER,
  algodPort: LOCALNET_ALGOD_PORT,
  blockExplorer: LOCALNET_BLOCK_EXPLORER,
}

export const networkConfigs: NetworkConfigs = {
  mainnet: MAINNET_CONFIG,
  testnet: TESTNET_CONFIG,
  betanet: BETANET_CONFIG,
  localnet: LOCALNET_CONFIG,
}

export const networkNames = Object.keys(networkConfigs) as NetworkName[]

export function getAddrUrl(addr: string, activeNetwork: NetworkId): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  if (url === "https://app.dappflow.org") {
    if (activeNetwork === "localnet") {
      return `${url}/setnetwork?name=sandbox&redirect=explorer/account/${addr}`
    } else {
      return `${url}/setnetwork?name=algonode_${activeNetwork}&redirect=explorer/account/${addr}`
    }
  } else {
    return `${url}/account/${addr}` // Allo uses account instead of AE-style "address"
  }
}
export function getAsaUrl(index: number, activeNetwork: NetworkId): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  if (url === "https://app.dappflow.org") {
    if (activeNetwork === "localnet") {
      return `${url}/setnetwork?name=sandbox&redirect=explorer/asset/${index}`
    } else {
      return `${url}/setnetwork?name=algonode_${activeNetwork}&redirect=explorer/asset/${index}`
    }
  } else {
    return `${url}/asset/${index}`
  }
}

export function getTxUrl(txId: string, activeNetwork: NetworkId): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  if (url === "https://app.dappflow.org") {
    if (activeNetwork === "localnet") {
      return `${url}/setnetwork?name=sandbox&redirect=explorer/transaction/${txId}`
    } else {
      return `${url}/setnetwork?name=algonode_${activeNetwork}&redirect=explorer/transaction/${txId}`
    }
  } else {
    return `${url}/tx/${txId}`
  }
}

export function getAppUrl(appId: number, activeNetwork: NetworkId): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  if (url === "https://app.dappflow.org") {
    if (activeNetwork === "localnet") {
      return `${url}/setnetwork?name=sandbox&redirect=explorer/application/${appId}`
    } else {
      return `${url}/setnetwork?name=algonode_${activeNetwork}&redirect=explorer/application/${appId}`
    }
  } else {
    return `${url}/application/${appId}`
  }
}
