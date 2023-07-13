import { initBGFunctions } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'
import { generateGuid } from '../common/helpers'
import { JsonRpc } from '../common/jsonrpc'
import { SandboxInitializationParams } from '../common/types'

export abstract class SandboxExecutor {
  private _worker: Worker
  private _stateMap = new Map<string, any>()
  private _detachConfigCallbacks: (() => void)[] = []
  private _jsonrpc: JsonRpc

  constructor(dappletScript: string, params: SandboxInitializationParams, jsonrpc: JsonRpc) {
    // sandbox.js provides environment for the script to run in
    // it includes Core-functions, DI container (Inject, Injectable) and adapter
    const sandboxScriptUrl = browser.runtime.getURL('sandbox.js')
    const serializedParams = JSON.stringify(params)

    // ToDo: remove self.chrome when we will path near-api-js correctly
    // ToDo: isolate global.postMessage and global.addEventListener
    const concatedScript = `
      self.chrome={runtime:{id:'id'}};
      importScripts("${sandboxScriptUrl}");
      self.initialize(${serializedParams});
      ${dappletScript}
    `
    const dataUri = URL.createObjectURL(new Blob([concatedScript]))
    this._worker = new Worker(dataUri, { name: params.manifest.name })
    this._worker.addEventListener('message', this._messageListener)

    this._jsonrpc = jsonrpc
    this._jsonrpc.addEventSource(this._worker as any) // ToDo: targetOrigin is incompatible with worker
  }

  public async activate() {
    // activate returns runtime loading result
    return await this._sendRequest('activate')
  }

  public async deactivate() {
    await this._sendRequest('deactivate')
    this._detachConfigCallbacks.forEach((cb) => cb())
    this._jsonrpc.removeEventSource(this._worker as any)
    this._worker.removeEventListener('message', this._messageListener)
    this._worker.terminate()
  }

  public abstract getDependency(name: string): any

  public onActionHandler() {
    this._notify('fireActionEvent')
  }

  public onHomeHandler() {
    this._notify('fireHomeEvent')
  }

  public onShareLinkHandler(data: any) {
    this._notify('fireShareLinkEvent', data)
  }

  public onWalletsUpdateHandler() {
    this._notify('fireWalletsUpdateEvent')
  }

  public executeConnectedAccountsUpdateHandler() {
    this._notify('fireConnectedAccountsUpdateEvent')
  }

  private _onConfigAttached({
    listeningContexts,
    adapterName,
  }: {
    listeningContexts: string[]
    adapterName: string
  }) {
    const adapter = this.getDependency(adapterName)

    const config = {}

    for (const contextName of listeningContexts) {
      config[contextName] = async (ctx) => {
        const widgets = await this._sendRequest('get-widgets-for-context', { ctx, contextName })
        const factories = widgets.map((widget) => {
          const widgetFactory = adapter.exports[widget.widgetName]
          const callbacks = widget.listeningEvents.reduce((acc, eventName) => {
            acc[eventName] = (data: any) => {
              this._notify('widget-event', { widgetId: widget.widgetId, eventName, data })
            }
            return acc
          }, {})

          const factory = widgetFactory({
            DEFAULT: {
              ...widget.stateValues,
              ...callbacks,
            },
          })

          return (...args: any[]) => {
            const instancedWidget = factory(...args)

            if (instancedWidget) {
              this._stateMap.set(widget.widgetId, instancedWidget.state)
            }

            return instancedWidget
          }
        })

        return factories
      }
    }

    adapter.attachConfig(config)

    this._detachConfigCallbacks.push(() => {
      adapter.detachConfig(config)
    })
  }

  private _onStateUpdated({ widgetId, newValues }: { widgetId: string; newValues: any }) {
    if (!newValues) return

    const state = this._stateMap.get(widgetId)
    if (!state) {
      // console.error('SandboxExecutor: State not found for widgetId ' + widgetId)
      return
    }

    for (const key in newValues) {
      state[key] = newValues[key]
    }
  }

  private async _sendRequest(method: string, ...params: any[]): Promise<any> {
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
      this._worker.postMessage({ id, method, params })
    })
  }

  private _notify(method: string, ...params: any[]) {
    this._worker.postMessage({ method, params })
  }

  private _messageListener = (e: MessageEvent) => {
    const { id, method, params } = e.data

    switch (method) {
      case 'config-attached':
        this._onConfigAttached(params[0])
        break
      case 'state-updated':
        this._onStateUpdated(params[0])
        break
      case 'callBgFunction':
        initBGFunctions(browser)
          .then((bgFunctions) => bgFunctions[params[0].method](...params[0].params))
          .then((result) => {
            this._worker.postMessage({ id, result })
          })
          .catch((error) => {
            this._worker.postMessage({ id, error })
          })
        break
      case 'confirm':
        this._worker.postMessage({ id, result: params[0] })

        break

      case 'alert':
        this._worker.postMessage({ id, result: params[0] })
        break
      case 'openPage':
        window.open(params[0], '_blank')
        this._worker.postMessage({ id })
        break
      default:
        console.warn(`SandboxExecutor: Unknown method ${method}`)
    }
  }
}
