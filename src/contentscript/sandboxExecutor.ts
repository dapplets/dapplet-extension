import { browser } from 'webextension-polyfill-ts'
import { generateGuid } from '../common/helpers'

export abstract class SandboxExecutor {
  private _worker: Worker

  constructor(script: string, moduleName: string) {
    // sandbox.js provides environment for the script to run in
    // it includes Core-functions, DI container (Inject, Injectable) and adapter
    const sandboxScriptUrl = browser.runtime.getURL('sandbox.js')
    const concatedScript = `importScripts("${sandboxScriptUrl}");${script}`
    const dataUri = URL.createObjectURL(new Blob([concatedScript]))
    this._worker = new Worker(dataUri, { name: moduleName })
  }

  public async activate() {
    await this._sendRequest('activate')
  }

  public async deactivate() {
    await this._sendRequest('deactivate')
    this._worker.terminate()
  }

  public abstract getDependency(name: string): any

  private async _sendRequest(method: string): Promise<any> {
    const id = generateGuid()

    return new Promise((res, rej) => {
      const listener = (e: MessageEvent) => {
        if (e.data.id === id) {
          this._worker.removeEventListener('message', listener)
          if (e.data.error) {
            rej(e.data.error)
          } else {
            res(e.data.result)
          }
        }
      }
      this._worker.addEventListener('message', listener)
      this._worker.postMessage({ id, method })
    })
  }
}
