/**
 * One file implementation of a global event bus for browser extensions.
 * Provides the same interface in all parts of an extension.
 */

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
  postMessage(message: EventMessage): void
  disconnect(): void
}

// Detect an extension's module

let environment: EnvType

try {
  if (typeof window === 'undefined') {
    environment = EnvType.BACKGROUND
  } else if (self !== top) {
    environment = EnvType.CONTENT_FRAME
  } else if (chrome.runtime) {
    environment = EnvType.CONTENT_SCRIPT
  } else {
    environment = EnvType.INPAGE_SCRIPT
  }
} catch (_) {
  environment = EnvType.INPAGE_SCRIPT
}

// Callbacks storage

const currentContext = (crypto as any).randomUUID()
const callbacks = new Map<string, Set<CallbackFunction>>()
const connections: Connection[] = []

function register(portOrWindow: chrome.runtime.Port | Window) {
  const _conn: any =
    typeof Window !== 'undefined' && portOrWindow instanceof Window ? {} : portOrWindow

  const callback = (message: EventMessage) => {
    message.from_env = environment

    message.from = currentContext // ToDo: change sender in relayed messages

    connections.filter((x) => x !== _conn).forEach((p) => p.postMessage(message)) // Notify all conections except itself
    callbacks.get(message.event)?.forEach((cb) => cb(message.data))
  }

  if (typeof Window !== 'undefined' && portOrWindow instanceof Window) {
    const listener = (e) => {
      if (typeof e.data === 'object' && e.data.bus === BUS_ID && e.data.from !== currentContext) {
        callback(e.data)
      }
    }
    portOrWindow.addEventListener('message', listener)

    _conn.postMessage = (msg) => portOrWindow.postMessage(msg)
    _conn.disconnect = () => {
      const index = connections.indexOf(_conn)
      if (index !== -1) {
        connections.splice(index, 1)
      }
      portOrWindow.removeEventListener('message', listener)
    }

    connections.push(_conn)
  } else {
    _conn.onMessage.addListener(callback)
    _conn.onDisconnect.addListener(() => {
      _conn.onMessage.removeListener(callback)
      const index = connections.indexOf(_conn)
      if (index !== -1) {
        connections.splice(index, 1)
      }
    })
    connections.push(_conn)
  }
}

if (environment === EnvType.BACKGROUND) {
  // Listen incoming connections to the background
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === BUS_ID) {
      register(port)
    }
  })
} else if (environment === EnvType.CONTENT_SCRIPT || environment === EnvType.CONTENT_FRAME) {
  // Connect to the background
  const port = chrome.runtime.connect({ name: BUS_ID } as any)
  register(port)

  if (environment === EnvType.CONTENT_SCRIPT) {
    // Listen incoming connections from the inpage script
    register(window)
  }
} else if (environment === EnvType.INPAGE_SCRIPT) {
  // Connect to the content script
  register(window)
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
