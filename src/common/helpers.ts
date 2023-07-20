import * as semver from 'semver'
import browser from 'webextension-polyfill'
import { DEFAULT_BRANCH_NAME } from './constants'
import {
  ChainTypes,
  MessageWrapperRequest,
  ModuleId,
  UrlAvailability,
  WalletDescriptor,
} from './types'

export function getHostName(url: string): string {
  return new URL(url).hostname
}

/**
 * Merges and deduplicates arrays of arrays
 * @param input arrays of arrays
 */
export function mergeDedupe<T>(input: T[][]): T[] {
  return [...new Set(mergeArrays(input))]
}

/**
 * Merges arrays of arrays
 * @param input arrays of arrays
 */
export function mergeArrays<T>(input: T[][]): T[] {
  return [].concat(...input)
}

/**
 * Compares name, branch and version of A and B
 * @param a manifest's part A
 * @param a manifest's part B
 */
export function areModulesEqual(a: ModuleId, b: ModuleId): boolean {
  return a.name === b.name && a.branch === b.branch && a.version === b.version
}

export enum UriTypes {
  Unknown = 0,
  Http,
  Swarm,
  Ipfs,
  Ethereum,
  Ens,
  Near,
}

/**
 * Recognizes a type of URI
 */
export function typeOfUri(uri: string): UriTypes {
  const uriLower = uri.toLowerCase()

  if (uriLower.indexOf('http://') === 0 || uriLower.indexOf('https://') === 0) {
    return UriTypes.Http
  }

  if (uriLower.indexOf('bzz://') === 0) {
    return UriTypes.Swarm
  }

  if (uriLower.indexOf('ipfs://') === 0) {
    return UriTypes.Ipfs
  }

  // ToDo: add Ethereum address validator
  if (uriLower.indexOf('0x') === 0 && uriLower.length === 42) {
    return UriTypes.Ethereum
  }

  if (uriLower.lastIndexOf('.eth') === uriLower.length - 4) {
    return UriTypes.Ens
  }

  if (
    uriLower.lastIndexOf('.near') === uriLower.length - 5 ||
    uriLower.lastIndexOf('.testnet') === uriLower.length - 8 ||
    uriLower.indexOf('dev-') === 0
  ) {
    return UriTypes.Near
  }

  return UriTypes.Unknown
}

/**
 * Assert function for filtering of fullfilled Promises with .filter()
 */
export function assertFullfilled<T>(
  item: PromiseSettledResult<T>
): item is PromiseFulfilledResult<T> {
  return item.status === 'fulfilled'
}

/**
 * Assert function for filtering of rejected Promises with .filter()
 */
export function assertRejected<T>(item: PromiseSettledResult<T>): item is PromiseRejectedResult {
  return item.status === 'rejected'
}

export function allSettled($) {
  'use strict'
  const self = this
  return self.all(
    $.map(
      function (value) {
        return self.resolve(value).then(this.$, this._)
      },
      {
        $: function (value) {
          return { status: 'fulfilled', value: value }
        },
        _: function (reason) {
          return { status: 'rejected', reason: reason }
        },
      }
    )
  )
}

export function timeoutPromise<T>(ms: number, promise: Promise<T>, timeoutCallback?: Function) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      timeoutCallback?.()
      reject(new Error('promise timeout'))
    }, ms)
    promise.then(
      (res) => {
        clearTimeout(timeoutId)
        resolve(res)
      },
      (err) => {
        clearTimeout(timeoutId)
        reject(err)
      }
    )
  })
}

export async function getCurrentTab(): Promise<browser.Tabs.Tab | null> {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true, active: true })
    const tab = tabs[0]

    if (!tab) return null

    return tab
  } catch (_) {
    return null
  }
}

export const getCurrentContextIds = async (tab: browser.Tabs.Tab | null): Promise<string[]> => {
  if (!tab) tab = await getCurrentTab()
  if (!tab) return []
  return browser.tabs.sendMessage(tab.id, { type: 'CURRENT_CONTEXT_IDS' })
}

export function networkName(chainId: number) {
  const map = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
    42: 'kovan',
    100: 'xdai',
  }

  return map[chainId] ?? 'unknown'
}

export async function fetchWithTimeout(resource, options) {
  const { timeout = 8000 } = options

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)

    return response
  } catch (err) {
    if (err.name === 'AbortError') {
      throw Error('Request timeout exceeded')
    } else {
      throw err
    }
  }
}

export async function waitTab(url: string) {
  const expectedUrl = new URL(url)

  const isEqualUrlParams = (expectedUrl: URL, receivedUrl: URL): boolean => {
    if (expectedUrl.origin !== receivedUrl.origin) return false
    if (expectedUrl.pathname !== receivedUrl.pathname) return false

    const entries: { [key: string]: string } = {}
    expectedUrl.searchParams.forEach((v, k) => (entries[k] = v))

    for (const key in entries) {
      if (
        !receivedUrl.searchParams.has(key) ||
        entries[key] !== receivedUrl.searchParams.get(key)
      ) {
        return false
      }
    }

    return true
  }

  return new Promise<browser.Tabs.Tab>((res, rej) => {
    const handler = async (tabId: number) => {
      const tab = await browser.tabs.get(tabId)
      const receivedUrl = new URL(tab.url)
      if (isEqualUrlParams(expectedUrl, receivedUrl)) {
        res(tab)
        browser.tabs.onUpdated.removeListener(handler)
      }
    }
    browser.tabs.onUpdated.addListener(handler)
  })
}

export function chainByUri(t: UriTypes): ChainTypes {
  switch (t) {
    case UriTypes.Ens:
      return ChainTypes.ETHEREUM_GOERLI
    case UriTypes.Ethereum:
      return ChainTypes.ETHEREUM_GOERLI
    case UriTypes.Near:
      return ChainTypes.NEAR_TESTNET
    default:
      return null
  }
}

/**
 * Add increment to filename for uniqueness
 * @param name filename
 * @returns
 */
export function incrementFilename(name: string): string {
  const n = Number.parseInt(/\(([0-9]*)\)$/gm.exec(name)?.[1] ?? '1')
  return n === 1 ? `${name} (2)` : name.replace(/\(([0-9]*)\)$/gm, `(${n + 1})`)
}

export function joinUrls(base: string, url: string) {
  return new URL(url, base).href
}

export function parseModuleName(
  str: string
): { name: string; branch: string; version: string } | null {
  const regex = /^([a-z0-9\.-]+)(?:#([a-z0-9-]+))?(?:@((?:[0-9]+\.[0-9]+\.[0-9]+)|latest))?$/gm
  const parsed = regex.exec(str)
  if (!parsed) return null

  return {
    name: parsed[1] ?? null,
    branch: parsed[2] ?? null,
    version: parsed[3] ?? null,
  }
}

export function pick(o: any, ...fields: string[]) {
  return fields.reduce((a, x) => {
    if (o.hasOwnProperty(x)) a[x] = o[x]
    return a
  }, {})
}

export async function waitClosingTab(tabId: number, windowId: number) {
  return new Promise<void>((res, rej) => {
    const handler = (_tabId, removeInfo) => {
      if (_tabId === tabId && windowId === removeInfo.windowId) {
        res()
        browser.tabs.onRemoved.removeListener(handler)
      }
    }
    browser.tabs.onRemoved.addListener(handler)
  })
}

export async function reloadCurrentPage() {
  if (typeof window !== 'undefined' && window['DAPPLETS_JSLIB'] === true) {
    window.location.reload()
  } else {
    const tab = await getCurrentTab()
    if (!tab) return
    browser.tabs.reload(tab.id)
  }
}

export function formatModuleId({ name, branch, version }: ModuleId) {
  return `${name}#${branch ?? DEFAULT_BRANCH_NAME}@${version}`
}

/**
 * Returns new array with all matches of `substr` replaced by elements of `newstrArray`
 */
export function multipleReplace(arr: string[], substr: string, newstrArray: string[]) {
  const newArr = arr.filter((x) => x !== substr)
  if (newArr.length !== arr.length) {
    newArr.push(...newstrArray)
  }
  return newArr
}

export type ShareLinkPayload = {
  sourceExtensionVersion: string
  registry: string
  moduleId: string
  contextIds: string[]
  payload: any
}

export function tryParseBase64Payload(base64Payload: string): ShareLinkPayload {
  try {
    const json = atob(base64Payload)
    const data = JSON.parse(json)
    if (!Array.isArray(data))
      throw new Error('Invalid payload. It must be Base64 encoded JSON-array.')
    const [version] = data

    // ToDo: check extension version when protocol will be changed

    if (semver.valid(version)) {
      const [, registry, moduleId, contextIds, payload] = data
      if (!registry) throw new Error('Invalid registry URI in the payload.')
      if (!moduleId || !parseModuleName(moduleId))
        throw new Error('Invalid module ID in the payload.')
      if (!contextIds || !Array.isArray(contextIds) || contextIds.length === 0)
        throw new Error('Invalid context IDs in the payload. Must be least one.')

      return { sourceExtensionVersion: version, moduleId, registry, payload, contextIds }
    } else {
      throw new Error('Invalid extension version in the payload.')
    }
  } catch (e) {
    console.error(e)
    return null
  }
}

export function parseShareLink(url: string) {
  const groups = /(.*)#dapplet\/(.*)/gm.exec(url)
  if (groups) {
    const [, urlNoPayload, payloadBase64] = groups
    return { urlNoPayload, payloadBase64 }
  } else {
    return { urlNoPayload: url, payloadBase64: null }
  }
}

export function groupBy<T>(array: T[], predicate: (v: T) => string) {
  return array.reduce((acc, value) => {
    ;(acc[predicate(value)] ||= []).push(value)
    return acc
  }, {} as { [key: string]: T[] })
}

/**
 * Returns bit value of hex string by bit number
 * @param hex hex string (0xdeadbeef) of any length
 * @param bitnumber index number of bit from the end (starts from 0)
 */
export function getBitFromHex(hex: string, bitnumber: number): boolean {
  return convertHexToBinary(hex).split('').reverse()[bitnumber] === '1'
}

/**
 * Converts hex-string to binary-string. Big numbers resistance.
 */
export function convertHexToBinary(hex: string): string {
  hex = hex.replace('0x', '').toLowerCase()
  let out = '' // ToDo: out is unused?
  for (const c of hex) {
    switch (c) {
      case '0':
        out += '0000'
        break
      case '1':
        out += '0001'
        break
      case '2':
        out += '0010'
        break
      case '3':
        out += '0011'
        break
      case '4':
        out += '0100'
        break
      case '5':
        out += '0101'
        break
      case '6':
        out += '0110'
        break
      case '7':
        out += '0111'
        break
      case '8':
        out += '1000'
        break
      case '9':
        out += '1001'
        break
      case 'a':
        out += '1010'
        break
      case 'b':
        out += '1011'
        break
      case 'c':
        out += '1100'
        break
      case 'd':
        out += '1101'
        break
      case 'e':
        out += '1110'
        break
      case 'f':
        out += '1111'
        break
      default:
        return ''
    }
  }
  return hex
}

export async function checkUrlAvailability(url: string): Promise<UrlAvailability> {
  try {
    const resp = await fetch(url)
    if (resp.ok) {
      return UrlAvailability.AVAILABLE
    } else {
      return UrlAvailability.SERVER_ERROR
    }
  } catch (err) {
    return UrlAvailability.NETWORK_ERROR
  }
}

/**
 * Decorator for async methods caching promises until it's not fulfilled.
 * Prevents execution of multiple promises at the same time.
 */
export function CacheMethod() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const symbol = Symbol()
    const originMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      const me = this as any
      if (!me[symbol]) {
        const result = originMethod.bind(me)(...args)
        if (result instanceof Promise) {
          me[symbol] = result
            .then((x) => {
              me[symbol] = null
              return x
            })
            .catch((e) => {
              me[symbol] = null
              throw e
            })
        } else {
          throw new Error('CachePromise decorator must be applied on async method.')
        }
      }
      return me[symbol]
    }
    return descriptor
  }
}

export async function getThisTab(callInfo: MessageWrapperRequest) {
  const thisTab = callInfo?.sender?.tab
  return thisTab
}

export function mergeSameWallets(descriptors: WalletDescriptor[]): WalletDescriptor[] {
  const wallets: WalletDescriptor[] = []

  for (const descriptor of descriptors) {
    const isEthereum =
      descriptor.chain === ChainTypes.ETHEREUM_GOERLI ||
      descriptor.chain === ChainTypes.ETHEREUM_XDAI
    const isTheSameWallets = wallets.findIndex((x) => x.type === descriptor.type) !== -1

    // skip the same wallets
    if (isEthereum && isTheSameWallets) {
      continue
    }

    wallets.push(descriptor)
  }

  return wallets
}

export function convertTimestampToISODate(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

export function convertISODateToTimestamp(isoDate: string): number {
  return new Date(isoDate).getTime() / 1000
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(blob)
  })
}

export function isE2ETestingEnvironment(win: Window): boolean {
  // ToDo: find another way to determine Cypress

  try {
    // Reading of href can throw Error when cross-origin
    const href = win.location.href

    if (href.indexOf('cypress') !== -1) return true
    if (href.indexOf('specs') !== -1) return true
    if (href.indexOf('localhost:55618') !== -1) return true

    return false
  } catch (_) {
    return false
  }
}

export const isValidUrl = (input: string) => {
  const type = typeOfUri(input)

  if (type === UriTypes.Ens) return true
  if (type === UriTypes.Ethereum) return true
  if (type === UriTypes.Near) return true
  if (type === UriTypes.Http) return true

  return false
}

export const isValidHttp = (url: string) => {
  try {
    new URL(url)
  } catch (_) {
    return false
  }

  return true
}

export const isValidPostageStampId = (id: string) => {
  return /^[0-9a-f]{64}$/gm.test(id)
}

export const numberWithCommas = (x: number) => {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export function Measure() {
  return function (target, method: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args) {
      const start = performance.now()
      try {
        const maybePromise = originalMethod.apply(this, args)
        if (Promise.resolve(maybePromise) === maybePromise) {
          return maybePromise
            .then((result) => {
              const end = performance.now()
              console.log({ method, args, async: true, result, time: end - start })
              return result
            })
            .catch((error) => {
              const end = performance.now()
              console.log({ method, args, async: true, error, time: end - start })
              return Promise.reject(error)
            })
        } else {
          const result = maybePromise
          const end = performance.now()
          console.log({ method, args, async: false, result, time: end - start })
          return result
        }
      } catch (error) {
        const end = performance.now()
        console.log({ method, args, async: false, error, time: end - start })
        throw error
      }
    }

    return descriptor
  }
}

export const objectMap = (obj, fn) =>
  Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]))

export const makeCancelable = (promise: Promise<void>) => {
  let onCancel: () => void
  const cancelPromise = new Promise((resolve, reject) => {
    onCancel = () => reject({ isCanceled: true })
  })
  return {
    promise: Promise.race([promise, cancelPromise]),
    cancel: onCancel,
  }
}
