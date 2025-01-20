import { NetworkConfig, NetworkName } from "./types"

export const BONFIRE_APP_IDS: { [key: string]: bigint } = {
  mainnet: 1257620981n, // Beta used 1305959747,
  testnet: 497806551n,
  betanet: 2019020358n,
  fnet: 0n, // Not deployed to FNet
  localnet: 1013n,
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

const FNET_ALGOD_TOKEN = import.meta.env.VITE_BETANET_ALGOD_TOKEN
const FNET_ALGOD_SERVER = import.meta.env.VITE_BETANET_ALGOD_SERVER
const FNET_ALGOD_PORT = import.meta.env.VITE_BETANET_ALGOD_PORT
const FNET_BLOCK_EXPLORER = import.meta.env.VITE_BETANET_BLOCK_EXPLORER

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
const FNET_CONFIG: NetworkConfig = {
  algodToken: FNET_ALGOD_TOKEN,
  algodServer: FNET_ALGOD_SERVER,
  algodPort: FNET_ALGOD_PORT,
  blockExplorer: FNET_BLOCK_EXPLORER,
}
const LOCALNET_CONFIG: NetworkConfig = {
  algodToken: LOCALNET_ALGOD_TOKEN,
  algodServer: LOCALNET_ALGOD_SERVER,
  algodPort: LOCALNET_ALGOD_PORT,
  blockExplorer: LOCALNET_BLOCK_EXPLORER,
}

export const networkConfigs: { [key: string]: NetworkConfig } = {
  mainnet: MAINNET_CONFIG,
  testnet: TESTNET_CONFIG,
  betanet: BETANET_CONFIG,
  fnet: FNET_CONFIG,
  localnet: LOCALNET_CONFIG,
}

export const networkNames = Object.keys(networkConfigs) as NetworkName[]

export function getAddrUrl(addr: string, activeNetwork: string): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  return `${url}/account/${addr}`
}
export function getAsaUrl(index: bigint, activeNetwork: string): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  return `${url}/asset/${index}`
}

export function getTxUrl(txId: string, activeNetwork: string): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  return `${url}/tx/${txId}`
}

export function getAppUrl(appId: bigint, activeNetwork: string): string {
  const config = networkConfigs[activeNetwork]
  const url = config.blockExplorer
  return `${url}/application/${appId}`
}
