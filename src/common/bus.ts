export class Bus {
  _callbacks = {}

  _queue: {
    [topic: string]: any[]
  } = {}

  constructor() {
    window.addEventListener('message', async (e) => {
      let data = null

      try {
        if (typeof e.data === 'object' && typeof e.data.message === 'string') {
          data = JSON.parse(e.data.message)
        } else {
          data = JSON.parse(e.data)
        }
      } catch {
        return
      }

      if (!data || !data.topic) return

      const callbacks = this._callbacks[data.topic] || []

      if (callbacks.length === 0) {
        if (this._queue[data.topic]) {
          this._queue[data.topic].push(data.args)
        } else {
          this._queue[data.topic] = [data.args]
        }
      } else {
        for (const callback of callbacks) {
          callback.apply({}, data.args)
        }
      }
    })
  }

  publish(topic: string, message?: any) {
    const windowName = window.name
    const msg = JSON.stringify({ topic, message, windowName })
    window.parent.postMessage(msg, '*')
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

  unsubscribe(topic: string) {
    this._callbacks[topic] = []
  }
}
