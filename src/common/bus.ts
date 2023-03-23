export class Bus {
  _callbacks = {}

  _queue: {
    [topic: string]: any[]
  } = {}

  publish(topic: string, args?: any) {
    const callbacks = this._callbacks[topic] || []

    if (callbacks.length === 0) {
      if (this._queue[topic]) {
        this._queue[topic].push(args)
      } else {
        this._queue[topic] = [args]
      }
    } else {
      for (const callback of callbacks) {
        callback.apply({}, args)
      }
    }
  }

  subscribe(topic: string, handler: (...args: any[]) => void) {
    if (!this._callbacks[topic]) {
      this._callbacks[topic] = []
    }
    this._callbacks[topic].push(handler)

    while (this._queue[topic]?.length > 0) {
      const args = this._queue[topic].shift()
      handler.apply({}, args)
    }
  }

  unsubscribe(topic: string, handler?: (...args: any[]) => void) {
    if (handler) {
      this._callbacks[topic] = (this._callbacks[topic] ?? []).filter((x) => x !== handler)
    } else {
      this._callbacks[topic] = []
    }
  }

  destroy() {
    this._callbacks = {}
    this._queue = {}
  }
}
