import { ChainTypes } from '../../common/types'
import GlobalConfigService from './globalConfigService'

export default class ProxyService {
  private _nextId = 0

  constructor(private _globalConfigService: GlobalConfigService) {}

  async fetchJsonRpc(chain: ChainTypes, method: string, params?: Array<any>): Promise<any> {
    let endpointUrl

    if (chain === ChainTypes.ETHEREUM_SEPOLIA) {
      endpointUrl = await this._globalConfigService.getEthereumProvider()
    } else if (chain === ChainTypes.ETHEREUM_XDAI) {
      endpointUrl = await this._globalConfigService.getXdaiProvider()
    } else {
      throw new Error('Unsupported network.')
    }

    const request = {
      method: method,
      params: params,
      id: this._nextId++,
      jsonrpc: '2.0',
    }

    return fetch(endpointUrl, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((json) => json.result)
  }
}
