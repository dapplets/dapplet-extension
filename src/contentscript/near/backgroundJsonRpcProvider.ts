import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { providers } from 'near-api-js'
import browser from 'webextension-polyfill'

export class BackgroundJsonRpcProvider extends providers.JsonRpcProvider {
  constructor(private _app: string, private _network: string) {
    super()
  }

  async sendJsonRpc(method: string, params: object): Promise<any> {
    const { near_sendCustomRequest } = await initBGFunctions(browser)
    return near_sendCustomRequest(this._app, this._network, method, params)
  }
}
