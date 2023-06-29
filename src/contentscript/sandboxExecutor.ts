import { browser } from 'webextension-polyfill-ts'
import { generateGuid } from '../common/helpers'

export abstract class SandboxExecutor {
  private _worker: Worker
  private _stateMap = new Map<string, any>()

  constructor(script: string, moduleName: string) {
    // sandbox.js provides environment for the script to run in
    // it includes Core-functions, DI container (Inject, Injectable) and adapter
    const sandboxScriptUrl = browser.runtime.getURL('sandbox.js')
    const concatedScript = `importScripts("${sandboxScriptUrl}");${script}`
    const dataUri = URL.createObjectURL(new Blob([concatedScript]))
    this._worker = new Worker(dataUri, { name: moduleName })
    this._worker.addEventListener('message', this._messageListener)
  }

  public async activate() {
    await this._sendRequest('activate')
  }

  public async deactivate() {
    await this._sendRequest('deactivate')
    this._worker.removeEventListener('message', this._messageListener)
    this._worker.terminate()
  }

  public abstract getDependency(name: string): any

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
        return widgets.map((widget) => {
          const widgetFactory = adapter.exports[widget.widgetName]
          const callbacks = widget.listeningEvents.reduce((acc, eventName) => {
            acc[eventName] = (data: any) => {
              this._notify('widget-event', { widgetId: widget.widgetId, eventName, data })
            }
            return acc
          }, {})

          return widgetFactory({
            DEFAULT: {
              ...widget.stateValues,
              ...callbacks,
              init: (ctx, state) => {
                callbacks.init?.(ctx, state)
                this._stateMap.set(widget.widgetId, state)
              },
            },
          })
        })
      }
    }

    adapter.attachConfig(config)
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
    switch (e.data.method) {
      case 'config-attached':
        this._onConfigAttached(e.data.params[0])
        break
      case 'state-updated':
        this._onStateUpdated(e.data.params[0])
        break
      default:
        console.warn(`SandboxExecutor: Unknown method ${e.data.method}`)
    }
  }
}
