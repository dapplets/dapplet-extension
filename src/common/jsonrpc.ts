import { generateGuid } from './generateGuid'

export type RpcMessageEvent = {
  data: any
  source?: EventMessaging
  origin?: EventMessaging
  target?: EventMessaging
}

/**
 * EventMessaging is a common interface for window and worker
 */
export interface EventMessaging {
  addEventListener(type: string, listener: (event: RpcMessageEvent) => void): void
  removeEventListener(type: string, listener: (event: RpcMessageEvent) => void): void
  postMessage(message: any, targetOrigin?: string): void
}

export class JsonRpc {
  private _callbacks = new Map<string, Set<Function>>()
  private _outcomingRequests = new Set<string>()
  private _defaultWindow: EventMessaging
  private _sources: EventMessaging[] = []

  constructor(defaultWindow?: EventMessaging) {
    this._defaultWindow = defaultWindow ?? (typeof window !== 'undefined' ? window : self)
    this._sources.push(this._defaultWindow)
    this._defaultWindow.addEventListener('message', this._handler)
  }

  public addEventSource(source: EventMessaging) {
    this._sources.push(source)
    source.addEventListener('message', this._handler)
  }

  public removeEventSource(source: EventMessaging) {
    this._sources = this._sources.filter((s) => s !== source)
    source.removeEventListener('message', this._handler)
  }

  public call(
    method: string,
    params: any[],
    frame: EventMessaging = this._defaultWindow
  ): Promise<any> {
    return new Promise((res, rej) => {
      const id = generateGuid()
      this._outcomingRequests.add(id)

      const rpcRequest = {
        jsonrpc: '2.0',
        id: id,
        method: method,
        params: params,
      }

      const json = JSON.stringify(rpcRequest)

      const handler = async (event: RpcMessageEvent) => {
        try {
          const rpcResponse = JSON.parse(event.data)
          if (rpcResponse.id !== id) return
          if (rpcResponse.method) return

          this._defaultWindow.removeEventListener('message', handler)
          this._outcomingRequests.delete(id)

          if (rpcResponse.error) {
            rej(rpcResponse.error.message)
            return
          }

          res(rpcResponse.result)
        } catch (_) {}
      }

      this._defaultWindow.addEventListener('message', handler)

      if (typeof window === 'undefined' || frame instanceof Worker) {
        frame.postMessage(json)
      } else {
        frame.postMessage(json, '*')
      }
    })
  }

  public on(method: string, callback: (...args: any[]) => Promise<any> | undefined | boolean) {
    if (!this._callbacks.has(method)) this._callbacks.set(method, new Set())
    this._callbacks.get(method).add(callback)
  }

  public destroy() {
    this._callbacks.clear()
    this._sources.forEach((source) => source.removeEventListener('message', this._handler))
  }

  private _handler = async (event: RpcMessageEvent) => {
    let rpcRequest

    try {
      rpcRequest = JSON.parse(event.data)
    } catch (_) {
      return
    }

    if (!rpcRequest.method || !rpcRequest.params || !rpcRequest.id) return
    if (this._outcomingRequests.has(rpcRequest.id)) return

    const source = event.source ?? event.target

    const callbacks = this._callbacks.get(rpcRequest.method) ?? new Set()

    for (const callback of callbacks) {
      try {
        const promise = callback(...rpcRequest.params, source)
        if (promise === undefined || promise === false) continue
        if (Promise.resolve(promise) !== promise && promise !== true) {
          // not a promise and not a true
          console.error('A callback in IframeMessenger.on() must return a Promise or undefined.')
          continue
        }

        const result = promise === true ? undefined : await promise

        const rpcResponse = JSON.stringify({
          jsonrpc: '2.0',
          result: result,
          id: rpcRequest.id,
        })

        ;(source as any).postMessage(rpcResponse, source)
        return
      } catch (err) {
        const rpcResponse = JSON.stringify({
          jsonrpc: '2.0',
          error: {
            message: typeof err === 'string' ? err : err.message,
          },
          id: rpcRequest.id,
        })

        ;(source as any).postMessage(rpcResponse, source)
        return
      }
    }

    const rpcResponse = JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: `Method not found: ${rpcRequest.method}`,
      },
      id: rpcRequest.id,
    })

    ;(source as any).postMessage(rpcResponse, event.origin)
  }
}
