import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as NearAPI from 'near-api-js'
import { browser } from 'webextension-polyfill-ts'
import { NearNetworkConfig } from '../../common/types'
import { BackgroundNear } from './backgroundNear'
import { BackgroundWalletConnection } from './backgroundWalletConnection'

async function _getCurrentNetworkConfig(networkId: string) {
  const { getNearNetworks } = await initBGFunctions(browser)
  const networkConfigs: NearNetworkConfig[] = await getNearNetworks()
  const currentNetworkConfig = networkConfigs.find((x) => x.networkId === networkId)
  if (!currentNetworkConfig)
    throw new Error(`Cannot find network "near/${networkId}" in the config.`)
  return currentNetworkConfig
}

export async function createWalletConnection(
  app: string,
  cfg: { network: string; contractId?: string }
) {
  const currentNetworkConfig = await _getCurrentNetworkConfig(cfg.network)

  const { localStorage_getItem } = await initBGFunctions(browser)
  const authDataKey = cfg.network + '_wallet_auth_key'
  const authData = JSON.parse(await localStorage_getItem(authDataKey))
  console.log('* authData', authData)
  if (!authData) return null

  const near = new BackgroundNear(app, currentNetworkConfig)
  console.log('* BackgroundNear', near)
  const wallet = new BackgroundWalletConnection(near, cfg.network, app)
  console.log('* BackgroundWalletConnection', wallet)
  wallet._authData = authData
  return wallet.account()
}

export async function createContractWrapper(
  app: string,
  cfg: { network: string },
  address: string,
  options: {
    viewMethods: string[]
    changeMethods: string[]
  }
) {
  const currentNetworkConfig = await _getCurrentNetworkConfig(cfg.network)
  console.log('in createContractWrapper: currentNetworkConfig', currentNetworkConfig)
  const near = new BackgroundNear(app, currentNetworkConfig)
  console.log('in createContractWrapper: BackgroundNear', near)
  const wallet = new BackgroundWalletConnection(near, cfg.network, app)
  console.log('in createContractWrapper: BackgroundWalletConnection', wallet)
  const account = wallet.account()
  const contract = new NearAPI.Contract(account, address, options)
  console.log('in createContractWrapper: contract', contract)
  return contract
}
