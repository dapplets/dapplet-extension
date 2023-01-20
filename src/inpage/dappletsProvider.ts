import * as EventBus from '../common/global-event-bus'
import { JsonRpc } from '../common/jsonrpc'
import { WalletDescriptor } from '../common/types'

type Account = {
  chain: string
  chainId: number
  account: string
}

type TrustedUser = {
  account: string
}

type Dapplet = {
  registry: string
  moduleName: string
}

export class DappletsProvider {
  public version = EXTENSION_VERSION

  constructor(private _rpc: JsonRpc) {}

  async getAccounts(): Promise<Account[]> {
    const descriptors: WalletDescriptor[] = await this._rpc.call('getWalletDescriptors', [], window)
    return descriptors
      .filter((x) => x.available && x.connected)
      .map((x) => ({
        chain: x.chain,
        chainId: x.chainId,
        account: x.account,
      }))
  }

  async connectWallet(): Promise<void> {
    return this._rpc.call('pairWalletViaOverlay', [], window)
  }

  async openPopup(): Promise<void> {
    return this._rpc.call('openPopup', [], window)
  }

  async openOverlay(): Promise<void> {
    return this._rpc.call('openOverlay', [], window)
  }

  async closeOverlay(): Promise<void> {
    return this._rpc.call('closeOverlay', [], window)
  }

  async toggleOverlay(): Promise<void> {
    return this._rpc.call('toggleOverlay', [], window)
  }

  async getTrustedUsers(): Promise<TrustedUser[]> {
    return this._rpc.call('callBackground', ['getTrustedUsers', []], window)
  }

  async addTrustedUser(account: string): Promise<void> {
    return this._rpc.call('callBackground', ['addTrustedUser', [account]], window)
  }

  async removeTrustedUser(account: string): Promise<void> {
    return this._rpc.call('callBackground', ['removeTrustedUser', [account]], window)
  }

  async getMyDapplets(): Promise<Dapplet[]> {
    return this._rpc.call('callBackground', ['getMyDapplets', []], window)
  }

  async addMyDapplet(registryUrl: string, moduleName: string): Promise<void> {
    return this._rpc.call('callBackground', ['addMyDapplet', [registryUrl, moduleName]], window)
  }

  async removeMyDapplet(registryUrl: string, moduleName: string): Promise<void> {
    return this._rpc.call('callBackground', ['removeMyDapplet', [registryUrl, moduleName]], window)
  }

  async openDeployOverlay(
    registryUrl: string,
    name: string,
    branch: string | null = null,
    version: string | null = null
  ): Promise<void> {
    return this._rpc.call('callBackground', [
      'openDeployOverlayById',
      [registryUrl, name, branch, version],
    ])
  }

  async openDeveloperOverlay(): Promise<void> {
    return this._rpc.call('callBackground', ['openPopupOverlay', ['developer']])
  }

  onTrustedUsersChanged(callback: () => void): void {
    EventBus.on('trustedusers_changed', callback)
  }

  onMyDappletsChanged(callback: () => void): void {
    EventBus.on('mydapplets_changed', callback)
  }

  onUninstall(callback: () => void): void {
    EventBus.on('disconnect', callback)
  }
}
