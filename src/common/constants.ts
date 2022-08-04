export const enum ModuleTypes {
  Feature = 'FEATURE',
  Adapter = 'ADAPTER',
  Library = 'LIBRARY',
  Interface = 'INTERFACE',
}

export const enum StorageTypes {
  Swarm = 'swarm',
  TestRegsitry = 'test-registry',
  Ipfs = 'ipfs',
  Sia = 'sia',
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
