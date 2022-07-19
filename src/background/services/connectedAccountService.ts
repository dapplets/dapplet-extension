import * as nearAPI from 'near-api-js'
import { DefaultSigners } from '../../common/types'
import GlobalConfigService from './globalConfigService'
import { WalletService } from './walletService'

export default class ConnectedAccountService {
  _contract: nearAPI.Contract

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService
  ) {}

  async getConnectedAccounts() {
    const contract = await this._getContract()
  }

  private async _getContract() {
    if (!this._contract) {
      const contractAddress = // await this._globalConfigService.getConnectedAccountContract()
      const near_account = await this._walletService.near_getAccount(DefaultSigners.EXTENSION)
      this._contract = new nearAPI.Contract(near_account, contractAddress, {
        viewMethods: [],
        changeMethods: [],
      })
    }

    return this._contract
  }
}
