import * as NearAPI from 'near-api-js'
import { NearNetworkConfig } from '../../../common/types'
import { browserStorage_get, initBGFunctions } from '../../communication'
import { BackgroundNear } from './backgroundNear'
import { BackgroundWalletConnection } from './backgroundWalletConnection'

async function _getCurrentNetworkConfig(networkId: string) {
  const { getNearNetworks } = initBGFunctions()
  const networkConfigs: NearNetworkConfig[] = await getNearNetworks()
  const currentNetworkConfig = networkConfigs.find((x) => x.networkId === networkId)
  if (!currentNetworkConfig)
    throw new Error(`Cannot find network "near/${networkId}" in the config.`)
  return currentNetworkConfig
}

export async function createWalletConnection(
  app: string,
  cfg: { network: string; loginConfirmationId?: string }
) {
  const currentNetworkConfig = await _getCurrentNetworkConfig(cfg.network)
  const authDataKey = cfg.network + '_wallet_auth_key'
  const authData = JSON.parse((await browserStorage_get(authDataKey))[authDataKey])
  if (!authData) return null

  const keyStorePrefix = cfg.loginConfirmationId
    ? `login-confirmation:${cfg.loginConfirmationId}:`
    : null

  const near = new BackgroundNear(app, currentNetworkConfig, keyStorePrefix)
  const wallet = new BackgroundWalletConnection(near, cfg.network, app)
  wallet._authData = authData
  return wallet.account()
}

export async function createContractWrapper(
  app: string,
  cfg: { network: string; loginConfirmationId?: string },
  address: string,
  options: {
    viewMethods: string[]
    changeMethods: string[]
  }
) {
  const keyStorePrefix = cfg.loginConfirmationId
    ? `login-confirmation:${cfg.loginConfirmationId}:`
    : null

  const currentNetworkConfig = await _getCurrentNetworkConfig(cfg.network)
  const near = new BackgroundNear(app, currentNetworkConfig, keyStorePrefix)
  const wallet = new BackgroundWalletConnection(near, cfg.network, app)
  const account = wallet.account()
  const contract = new NearAPI.Contract(account, address, options)
  return contract
}
