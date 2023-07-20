import browser from 'webextension-polyfill'
import { generateGuid } from '../../common/generateGuid'
import { SandboxInitializationParams } from '../../common/types'

/**
 * The IFrameContainer class creates and manages a sandboxed iframe within the web page context.
 * It serves as a secure container for running dapplets and overcomes restrictions like
 * Content Security Policy (CSP) that prevent direct usage of certain features like WebWorkers.
 * It sends commands to the iframe to create and terminate dapplet workers and to send messages
 * to them.
 */
export class IFrameContainer {
  private _messageListenersByWorkerId = new Map<string, Set<Function>>()
  private _iframe: HTMLIFrameElement

  constructor() {
    const sandboxIframeUrl = browser.runtime.getURL('sandbox.html')
    this._iframe = document.createElement('iframe')
    this._iframe.src = sandboxIframeUrl
    this._iframe.style.display = 'none'
    window.addEventListener('message', this._sandboxIframeListener)
    document.body.appendChild(this._iframe)
  }

  public addWorkerListener(workerId: string, listener: (message: any) => void) {
    const listeners = this._messageListenersByWorkerId.get(workerId)
    if (listeners) {
      listeners.add(listener)
    } else {
      this._messageListenersByWorkerId.set(workerId, new Set([listener]))
    }
  }

  public removeWorkerListener(workerId: string, listener: (message: any) => void) {
    const listeners = this._messageListenersByWorkerId.get(workerId)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  public postMessageToWorker(workerId: string, workerMessage: any) {
    const message = {
      method: 'postMessageToWorker',
      params: [workerId, workerMessage],
    }

    this._iframe.contentWindow.postMessage(message, '*')
  }

  public createWorker(
    dappletScript: string,
    injectorInitParams: SandboxInitializationParams
  ): string {
    const workerId = generateGuid()
    const workerScriptUrl = browser.runtime.getURL('worker.js')

    const message = {
      method: 'createWorker',
      params: [workerId, workerScriptUrl, dappletScript, injectorInitParams],
    }

    this._iframe.contentWindow.postMessage(message, '*')
    return workerId
  }

  public terminateWorker(workerId: string) {
    const message = {
      method: 'terminateWorker',
      params: [workerId],
    }

    this._iframe.contentWindow.postMessage(message, '*')
  }

  public destroy() {
    this._iframe.removeEventListener('message', this._sandboxIframeListener)
    this._iframe.remove()
    this._messageListenersByWorkerId.clear()
  }

  private _sandboxIframeListener = (event: MessageEvent) => {
    const { method, params } = event.data

    if (method === 'postMessageFromWorker') {
      const [workerId, message] = params
      const listeners = this._messageListenersByWorkerId.get(workerId)
      if (listeners) {
        listeners.forEach((listener) => listener(message))
      }
    }
  }
}
