import { MESSAGE_BUS_NAME } from './constants'

export default class WebSocketProxy {
  public createConnectListener() {
    return function (port: any) {
      if (port.name === MESSAGE_BUS_NAME) {
        let ws: WebSocket = null

        port.onMessage.addListener((message: { data: string; event: string }) => {
          if (message.event == 'connect') {
            ws = new WebSocket(message.data)

            ws.onopen = (ev) => {
              port.postMessage({ event: 'open' })
            }

            ws.onmessage = (ev) => {
              port.postMessage({ data: ev.data, event: 'message' })
            }

            ws.onerror = (ev) => {
              port.postMessage({ event: 'error' })
            }

            ws.onclose = (ev) => {
              port.disconnect()
            }
          } else if (message.event == 'message') {
            ws.send(message.data)
          }
        })

        port.onDisconnect.addListener(() => {
          ws.close()
        })
      }
    }
  }
}
