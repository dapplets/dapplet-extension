import { providers } from 'near-api-js'
import { initBGFunctions } from '../../communication'

export class BackgroundJsonRpcProvider extends providers.JsonRpcProvider {
  constructor(private _app: string, private _network: string) {
    super()
  }

  async sendJsonRpc(method: string, params: object): Promise<any> {
    const { near_sendCustomRequest } = initBGFunctions()
    return near_sendCustomRequest(this._app, this._network, method, params)
  }
}
