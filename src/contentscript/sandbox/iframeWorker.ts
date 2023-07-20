import { EventMessaging, RpcMessageEvent } from '../../common/jsonrpc'
import { SandboxInitializationParams } from '../../common/types'
import { IFrameContainer } from './iframeContainer'

/**
 * A wrapper for the iframe container that implements similar with Worker
 * interface with messaging methods (postMessage, addEventListener, removeEventListener).
 * It also implements EventMessaging interface to be compatible with
 * JsonRpc Event Bus in src/common/jsonrpc.ts
 */
export class IFrameWorker implements EventMessaging {
  private _workerId: string
  private _listenerWrappers = new WeakMap() // ToDo: refactor messaging

  constructor(
    private _iframeContainer: IFrameContainer,
    dappletScript: string,
    injectorInitParams: SandboxInitializationParams
  ) {
    this._workerId = _iframeContainer.createWorker(dappletScript, injectorInitParams)
  }

  addEventListener(type: string, listener: (event: RpcMessageEvent) => void): void {
    if (type !== 'message') throw new Error('Only "message" event is supported')
    // Wrap data and source to be compatible with EventMessaging interface
    const listenerWrapper = (data) => listener({ data, source: this })
    this._listenerWrappers.set(listener, listenerWrapper)
    this._iframeContainer.addWorkerListener(this._workerId, listenerWrapper)
  }

  removeEventListener(type: string, listener: (event: RpcMessageEvent) => void): void {
    if (type !== 'message') throw new Error('Only "message" event is supported')
    const listenerWrapper = this._listenerWrappers.get(listener)
    if (!listenerWrapper) return
    this._iframeContainer.removeWorkerListener(this._workerId, listenerWrapper)
  }

  postMessage(message: any): void {
    this._iframeContainer.postMessageToWorker(this._workerId, message)
  }

  terminate(): void {
    this._iframeContainer.terminateWorker(this._workerId)
  }
}
