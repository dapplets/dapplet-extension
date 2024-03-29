import { IPubSub } from './types'

export class WsJsonRpc implements IPubSub {
  private _queue: any[] = []
  private _ws: WebSocket

  private _msgCount = 0

  constructor(public readonly url: string) {
    this._connect()
  }

  public exec(topic: string, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this._msgCount
      this._send(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          method: topic,
          params: [message],
        })
      )
      const listener = (e: MessageEvent) => {
        const rpc = JSON.parse(e.data)

        if (!rpc.method && rpc.id === id) {
          this._ws.removeEventListener('message', listener)
          if (!rpc.error) {
            resolve(rpc.result)
          } else {
            reject(rpc.error)
          }
        }
      }
      this._ws.addEventListener('message', listener)
    })
  }

  public onMessage(handler: (topic: string, message: any) => void) {
    const listener = (e: MessageEvent) => {
      const rpc = JSON.parse(e.data)
      if (rpc.method) handler(rpc.method, rpc.params[0])
    }

    this._ws.addEventListener('message', listener)

    return {
      off: () => this._ws.removeEventListener('message', listener),
    }
  }

  private _connect() {
    this._ws = new WebSocket(this.url)
    this._ws.addEventListener('open', () => {
      this._queue.forEach((msg) => this._ws.send(msg))
      this._queue = []
    })
    this._ws.addEventListener('close', () => {
      this._msgCount = 0
    })
  }

  private _send(data: any) {
    if (this._ws.readyState !== WebSocket.OPEN) {
      this._queue.push(data)
      if (this._ws.readyState === WebSocket.CLOSED) {
        this._connect()
      }
    } else {
      this._ws.send(data)
    }
  }
}
