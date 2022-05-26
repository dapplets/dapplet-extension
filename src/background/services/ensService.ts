import { DefaultSigners } from '../../common/types'
import { WalletService } from './walletService'

export default class EnsService {
  constructor(private _walletService: WalletService) {}

  async resolveName(name: string): Promise<string> {
    const signer = await this._walletService.eth_getSignerFor(DefaultSigners.EXTENSION)
    return signer.resolveName(name)
  }
}
