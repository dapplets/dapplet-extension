import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { Observable, Subscription } from 'rxjs'
import browser from 'webextension-polyfill'
import { generateGuid } from '../../common/generateGuid'
import { JsonRpc, RpcMessageEvent } from '../../common/jsonrpc'
import { BaseEvent, SandboxInitializationParams } from '../../common/types'
import { IFrameContainer } from './iframeContainer'
import { IFrameWorker } from './iframeWorker'

/**
 * The DappletExecutor class is responsible for executing the code of dapplets
 * within a secured and isolated environment. It provides methods to communicate
 * with the dapplets and manages their execution.
 */
export abstract class DappletExecutor {
  private _stateByWidgetId = new Map<string, any>()
  private _detachConfigCallbacksById = new Map<string, any>()
  private _jsonrpc: JsonRpc
  private _eventBusSubscription: Subscription
  private _worker: IFrameWorker

  constructor(
    sandboxContainer: IFrameContainer,
    dappletScript: string,
    injectorInitParams: SandboxInitializationParams,
    jsonrpc: JsonRpc,
    moduleEventBus: Observable<unknown>
  ) {
    this._worker = new IFrameWorker(sandboxContainer, dappletScript, injectorInitParams)
    this._worker.addEventListener('message', this._messageListener)

    this._jsonrpc = jsonrpc
    this._jsonrpc.addEventSource(this._worker as any) // ToDo: targetOrigin is incompatible with worker

    this._eventBusSubscription = moduleEventBus.subscribe(this._eventBusListener)
  }

  public async activate() {
    // activate returns runtime loading result
    return await this._sendRequest('activate')
  }

  public async deactivate() {
    await this._sendRequest('deactivate')
    this._detachConfigCallbacksById.forEach((cb) => cb())
    this._detachConfigCallbacksById.clear()
    this._eventBusSubscription.unsubscribe()
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

  public onConnectedAccountsUpdateHandler() {
    this._notify('fireConnectedAccountsUpdateEvent')
  }

  private _eventBusListener = (event: BaseEvent) => {
    this._notify('fireEventBus', event)
  }

  private _onConfigAttached({
    configId,
    listeningContexts,
    adapterName,
  }: {
    configId: string
    listeningContexts: string[]
    adapterName: string
  }) {
    const adapter = this.getDependency(adapterName)

    const config = {
      events: {
        context_changed: (_, newContext, oldContext, contextName) => {
          // is a parsed context?
          if (typeof contextName === 'string') {
            this._notify('context-changed', {
              contextName,
              newContext,
              oldContext,
              adapterName,
            })
          }
        },
      },
    }

    for (const contextName of listeningContexts) {
      config[contextName] = async (ctx) => {
        const widgets = await this._sendRequest('get-widgets-for-context', {
          configId,
          ctx,
          contextName,
          adapterName,
        })
        const factories = widgets.map((widget) => {
          const widgetFactory = adapter.exports[widget.widgetName]
          const callbacks = widget.listeningEvents.reduce((acc, eventName) => {
            acc[eventName] = (data: any) => {
              this._notify('widget-event', {
                widgetId: widget.widgetId,
                eventName,
                data,
                adapterName,
              })
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
              this._stateByWidgetId.set(widget.widgetId, instancedWidget.state)
            }

            return instancedWidget
          }
        })

        return factories
      }
    }

    adapter.attachConfig(config)

    this._detachConfigCallbacksById.set(configId, () => adapter.detachConfig(config))
  }

  private _onConfigDetached({ configId }: { configId: string }) {
    if (!this._detachConfigCallbacksById.has(configId)) return

    const detachConfigFn = this._detachConfigCallbacksById.get(configId)
    detachConfigFn()

    this._detachConfigCallbacksById.delete(configId)
  }

  private _onStateUpdated({ widgetId, newValues }: { widgetId: string; newValues: any }) {
    if (!newValues) return

    const state = this._stateByWidgetId.get(widgetId)
    if (!state) {
      // console.error('DappletExecutor: State not found for widgetId ' + widgetId)
      return
    }

    for (const key in newValues) {
      state[key] = newValues[key]
    }
  }

  private async _sendRequest(method: string, ...params: any[]): Promise<any> {
    const id = generateGuid()

    return new Promise((res, rej) => {
      const listener = (e: RpcMessageEvent) => {
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

  private _messageListener = (e: RpcMessageEvent) => {
    const { id, method, params } = e.data

    switch (method) {
      case 'config-attached':
        this._onConfigAttached(params[0])
        break
      case 'config-detached':
        this._onConfigDetached(params[0])
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
        this._worker.postMessage({ id, result: confirm(params[0]) })
        break
      case 'alert':
        alert(params[0])
        this._worker.postMessage({ id })
        break
      case 'openPage':
        window.open(params[0], '_blank')
        this._worker.postMessage({ id })
        break
      default:
        console.warn(`DappletExecutor: Unknown method ${method}`)
    }
  }
}
