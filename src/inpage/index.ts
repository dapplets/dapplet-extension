import * as EventBus from '../common/global-event-bus'
import { JsonRpc } from '../common/jsonrpc'
import { DappletsProvider } from './dappletsProvider'

const jsonrpc = new JsonRpc(window)
const dappletsProvider = new DappletsProvider(jsonrpc)

;(window as Record<string, any>).dapplets = dappletsProvider
window.dispatchEvent(new Event('dapplets#initialized'))

EventBus.on('disconnect', () => {
  ;(window as Record<string, any>).dapplets = undefined
  EventBus.destroy()
  jsonrpc.destroy()
})
