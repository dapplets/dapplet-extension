/**
 * One file implementation of a global event bus for browser extensions.
 * Provides the same interface in all parts of an extension.
 */

import { Browser } from 'webextension-polyfill'
import { generateGuid } from './generateGuid'

// Constants

const BUS_ID = 'GLOBAL_EVENT_BUS_UNIQUE'

// Typing

enum EnvType {
  BACKGROUND = 'BACKGROUND',
  CONTENT_SCRIPT = 'CONTENT_SCRIPT',
  CONTENT_FRAME = 'CONTENT_FRAME',
  INPAGE_SCRIPT = 'INPAGE_SCRIPT',
}

type EventMessage = {
  bus: string
  from_env: string
  from: string
  event: string
  data: any
}

type CallbackFunction = (data: any) => void

type EmitParams = {
  global?: boolean
}

interface Connection {
  addListener: (cb: (message: EventMessage | MessageEvent<EventMessage>) => void) => void
  removeListener: (cb: (message: EventMessage | MessageEvent<EventMessage>) => void) => void
  postMessage(message: EventMessage): void
  disconnect?(): void
}

// Detect an extension's module

let environment: EnvType
let browser: Browser

try {
  browser = require('webextension-polyfill')
  // eslint-disable-next-line no-empty
} catch (_) {}

try {
  if (typeof window === 'undefined') {
    environment = EnvType.BACKGROUND
  } else if (self !== top) {
    environment = EnvType.CONTENT_FRAME
  } else if (browser.runtime) {
    environment = EnvType.CONTENT_SCRIPT
  } else {
    environment = EnvType.INPAGE_SCRIPT
  }
} catch (_) {
  environment = EnvType.INPAGE_SCRIPT
}

// Callbacks storage

const currentContext = generateGuid()
const callbacks = new Map<string, Set<CallbackFunction>>()
const connections: Connection[] = []

function register(connection: Connection) {
  const callback = (messageOrEvent: EventMessage | MessageEvent<EventMessage>) => {
    const message = messageOrEvent instanceof Event ? messageOrEvent.data : messageOrEvent

    if (typeof message !== 'object') return
    if (message.bus !== BUS_ID) return
    if (message.from === currentContext) return

    message.from_env = environment
    message.from = currentContext // ToDo: change sender in relayed messages

    connections.filter((x) => x !== connection).forEach((p) => p.postMessage(message)) // Notify all conections except itself
    callbacks.get(message.event)?.forEach((cb) => cb(message.data))

    return Promise.resolve()
  }

  connection.addListener(callback)
  connection.disconnect = () => {
    const index = connections.indexOf(connection)
    if (index !== -1) {
      connections.splice(index, 1)
    }

    connection.removeListener(callback)
  }

  connections.push(connection)
}

if (environment === EnvType.BACKGROUND) {
  // Listen incoming connections to the background
  register({
    addListener: browser.runtime.onMessage.addListener,
    removeListener: browser.runtime.onMessage.removeListener,
    postMessage: (message) => {
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          browser.tabs.sendMessage(tab.id, message)
        })
      })
    },
  })
} else if (environment === EnvType.CONTENT_SCRIPT) {
  // ToDo: CONTENT_FRAME was excluded because it conflicts with cypress
  // || environment === EnvType.CONTENT_FRAME

  // Connect to the background
  register({
    addListener: browser.runtime.onMessage.addListener,
    removeListener: browser.runtime.onMessage.removeListener,
    postMessage: browser.runtime.sendMessage,
  })

  if (environment === EnvType.CONTENT_SCRIPT) {
    // Listen incoming connections from the inpage script
    register({
      addListener: (cb) => window.addEventListener('message', cb),
      removeListener: (cb) => window.removeEventListener('message', cb),
      postMessage: (msg) => window.postMessage(msg),
    })
  }
} else if (environment === EnvType.INPAGE_SCRIPT) {
  // Connect to the content script
  register({
    addListener: (cb) => window.addEventListener('message', cb),
    removeListener: (cb) => window.removeEventListener('message', cb),
    postMessage: (msg) => window.postMessage(msg),
  })
}

export function emit(event: string, data?: any, params?: EmitParams) {
  if (params === undefined) {
    params = {}
  }

  // global by default
  if (params.global === undefined) {
    params.global = true
  }

  if (params.global) {
    connections.forEach((x) =>
      x.postMessage({
        event,
        data,
        bus: BUS_ID,
        from: currentContext,
        from_env: environment,
      })
    )
  }

  callbacks.get(event)?.forEach((cb) => cb(data))
}

export function on(event: string, callback: CallbackFunction) {
  if (!callbacks.has(event)) {
    callbacks.set(event, new Set())
  }

  callbacks.get(event).add(callback)
}

export function off(event: string, callback: CallbackFunction) {
  callbacks.get(event)?.delete(callback)
}

export function destroy() {
  callbacks.clear()
  ;[...connections].forEach((x) => x.disconnect())
}
