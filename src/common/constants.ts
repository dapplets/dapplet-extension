import { ChainTypes } from './types'

export const enum ModuleTypes {
  Feature = 'FEATURE',
  Adapter = 'ADAPTER',
  Library = 'LIBRARY',
  Interface = 'INTERFACE',
  ParserConfig = 'CONFIG',
}

export const enum StorageTypes {
  Swarm = 'swarm',
  TestRegsitry = 'test-registry',
  Ipfs = 'ipfs',
}

export type WalletInfo = {
  compatible: boolean
  protocolVersion: string
  engineVersion: string
  device: {
    manufacturer: string
    model: string
  }
}

export const DEFAULT_BRANCH_NAME = 'default'

export const CONTEXT_ID_WILDCARD = '*'

export const DAPPLETS_STORE_URL = 'https://store.dapplets.org'

export const SECURE_AUTH_METHODS: string[] = [
  ChainTypes.ETHEREUM_GOERLI,
  ChainTypes.ETHEREUM_XDAI,
  ChainTypes.NEAR_MAINNET,
  ChainTypes.NEAR_TESTNET,
]
