import { generateGuid } from './helpers'

// ToDo: rewrite this to use RxJS

export async function sendRequest(method: string, ...params: any[]): Promise<any> {
  const id = generateGuid()

  return new Promise((res, rej) => {
    const listener = (e: MessageEvent) => {
      if (e.data.id === id) {
        global.removeEventListener('message', listener)
        if (e.data.error) {
          rej(e.data.error)
        } else {
          res(e.data.result)
        }
      }
    }
    global.addEventListener('message', listener)

    try {
      global.postMessage({ id, method, params })
    } catch (err) {
      global.removeEventListener('message', listener)
      console.error('Cannot send request: ', { id, method, params })
      rej(err)
    }
  })
}

export async function callBgFunction(method: string, ...params: any[]): Promise<any> {
  return sendRequest('callBgFunction', { method, params })
}

export function initBGFunctions(): any {
  return new Proxy(
    {},
    {
      get: (_, method: string) => {
        return (...params: any[]) => {
          return callBgFunction(method, ...params)
        }
      },
    }
  )
}

export function browserStorage_get(key?: string): Promise<any> {
  return callBgFunction('browserStorage_get', key)
}

export function browserStorage_set(kv: any): Promise<void> {
  return callBgFunction('browserStorage_set', kv)
}

export function browserStorage_remove(key: string): Promise<void> {
  return callBgFunction('browserStorage_remove', key)
}

export function getURL(url: string): Promise<string> {
  return callBgFunction('getURL', url)
}
