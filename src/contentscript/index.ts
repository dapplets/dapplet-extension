import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { Subject } from 'rxjs'
import { browser } from 'webextension-polyfill-ts'
import { GLOBAL_EVENT_BUS_NAME } from '../common/chrome-extension-websocket-wrapper/constants'
import * as EventBus from '../common/global-event-bus'
import {
  assertFullfilled,
  isE2ETestingEnvironment,
  parseModuleName,
  parseShareLink,
  ShareLinkPayload,
  timeoutPromise,
  tryParseBase64Payload,
} from '../common/helpers'
import { JsonRpc } from '../common/jsonrpc'
import { DefaultSigners, SystemOverlayTabs } from '../common/types'
import Core from './core'
import { BaseEvent } from './events/baseEvent'
import { Injector } from './injector'
import { OverlayManagerIframe } from './overlay/iframe/overlayManager'
import { IOverlay } from './overlay/interfaces'
import { OverlayManager } from './overlay/root/overlayManager'

const IS_OVERLAY_IFRAME = window.name.indexOf('dapplet-overlay') !== -1
const IS_E2E_ENV = isE2ETestingEnvironment(window)
let injector: Injector // ToDo ------> look at the getRegistriesInfo() ToDo

/* ToDo: The function is needed for ./overlay/root/utils/createUserEnvInfo.ts that's used in Dapplet.tsx.
/        We cannot get the injector via props or context in Dapplet.tsx because it's mutable.
/        The cyclic dependency needs refactoring.
*/
export function getRegistriesInfo() {
  return injector.registry
}

async function init() {
  const IS_LIBRARY = window['DAPPLETS_JSLIB'] === true
  const IS_E2E_IFRAME = isE2ETestingEnvironment(window.top)
  const IS_IFRAME = IS_E2E_IFRAME ? false : self !== top

  const shareLinkPayload = await processShareLink().catch((e) => {
    console.error('Cannot process the share link', e)
    return null
  })
  const port = browser.runtime.connect({ name: GLOBAL_EVENT_BUS_NAME } as any)

  const jsonrpc = new JsonRpc()
  const overlayManager = IS_IFRAME ? new OverlayManagerIframe(jsonrpc) : new OverlayManager(jsonrpc)

  const eventStream = new Subject<BaseEvent>()

  const core = new Core(IS_IFRAME, overlayManager) // ToDo: is it global for all modules?
  injector = new Injector(core, eventStream, { shareLinkPayload })

  // Open confirmation overlay if checks are not passed
  if (!IS_LIBRARY && shareLinkPayload && !shareLinkPayload.isAllOk) {
    core.waitSystemOverlay({
      activeTab: SystemOverlayTabs.DAPPLET_CONFIRMATION,
      payload: shareLinkPayload,
      popup: false,
    })
  }

  const getAllContextIds = async (): Promise<string[]> => {
    const contextIDs = [...injector.availableContextIds]
    const frameResults = await Promise.allSettled(
      Array.from(window.frames).map((x) =>
        timeoutPromise(300, jsonrpc.call('CURRENT_CONTEXT_IDS', [], x))
      )
    )
    frameResults.filter(assertFullfilled).forEach((x) => contextIDs.push(...x.value))
    return Array.from(new Set(contextIDs)) // deduplicate array
  }

  browser.runtime.onMessage.addListener((message) => {
    if (!message || !message.type) return

    if (message.type === 'FEATURE_ACTIVATED') {
      return injector.loadModules(message.payload.modules)
    } else if (message.type === 'FEATURE_DEACTIVATED') {
      return injector.unloadModules(message.payload.modules)
    } else if (!IS_IFRAME && message.type === 'CURRENT_CONTEXT_IDS') {
      return getAllContextIds()
    } else if (!IS_IFRAME && message.type === 'OPEN_DAPPLET_ACTION') {
      const { moduleName } = message.payload
      return injector.openDappletAction(moduleName)
    } else if (!IS_IFRAME && message.type === 'OPEN_DAPPLET_HOME') {
      const { moduleName } = message.payload
      return injector.openDappletHome(moduleName)
    } else if (!IS_IFRAME && message.type === 'EXEC_CA_UPDATE_HANDLER') {
      return injector.executeConnectedAccountsUpdateHandler()
    } else if (!IS_IFRAME && message.type === 'MODULE_EVENT_STREAM_MESSAGE') {
      return Promise.resolve(eventStream.next(message.payload))
    }
  })

  // Handle module (de)activations from another tabs
  EventBus.on('dapplet_activated', (m) => injector.loadModules([m]))
  EventBus.on('dapplet_deactivated', (m) => injector.unloadModules([m]))

  EventBus.on('wallet_changed', () => injector.executeWalletsUpdateHandler())

  EventBus.on('connected_accounts_changed', () => injector.executeConnectedAccountsUpdateHandler())

  // destroy when background is disconnected
  port.onDisconnect.addListener(() => {
    console.log(
      '[DAPPLETS]: The connection to the background service has been lost. Content script is unloading...'
    )
    EventBus.emit('disconnect')
    EventBus.destroy()
    jsonrpc.destroy()
    injector.dispose()
    core.overlayManager.destroy()
  })

  const overlayMap = new Map<string, IOverlay>()

  jsonrpc.on('CURRENT_CONTEXT_IDS', getAllContextIds)

  jsonrpc.on(
    'OVERLAY_CREATE',
    (
      id: string,
      url: string,
      title: string,
      source: string,
      hidden: boolean,
      sourceWindow: any
    ) => {
      const overlay = overlayManager.createOverlay({ url, title, source, hidden })
      overlay.onregisteredchange = (v) =>
        jsonrpc.call('OVERLAY_REGISTERED_CHANGE', [id, v], sourceWindow)
      overlay.onMessage((topic, message) =>
        jsonrpc.call('OVERLAY_EXEC', [id, topic, message], sourceWindow)
      )
      overlayMap.set(id, overlay)
      return true
    }
  )

  jsonrpc.on('OVERLAY_OPEN', async (id: string) => {
    return new Promise((res) => overlayMap.get(id)?.open(res))
  })

  jsonrpc.on('OVERLAY_CLOSE', (id: string) => {
    overlayMap.get(id)?.close()
    return true
  })

  jsonrpc.on('OVERLAY_SEND', (id: string, topic: string, args: any[]) => {
    overlayMap.get(id)?.send(topic, args)
    return true
  })

  jsonrpc.on('OVERLAY_EXEC', (id: string, topic: string, message: any) => {
    return overlayMap.get(id)?.exec(topic, message)
  })

  jsonrpc.on('OVERLAY_MANAGER_UNREGISTER_ALL', (source: string) => {
    overlayManager.unregisterAll(source)
    return true
  })

  jsonrpc.on('pairWalletViaOverlay', () => {
    return initBGFunctions(browser).then((x) =>
      x.pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
    )
  })

  jsonrpc.on('getWalletDescriptors', () => {
    return initBGFunctions(browser).then((x) => x.getWalletDescriptors())
  })

  jsonrpc.on('callBackground', (method: string, args: any[]) => {
    if (method === 'wipeAllExtensionData' && !IS_E2E_IFRAME) {
      return Promise.reject('This function is for E2E testing only.')
    }

    return initBGFunctions(browser).then((x) => x[method](...args))
  })

  jsonrpc.on('openOverlay', () => Promise.resolve(core.openOverlay()))
  jsonrpc.on('closeOverlay', () => Promise.resolve(core.closeOverlay()))
  jsonrpc.on('toggleOverlay', () => Promise.resolve(core.toggleOverlay()))
  jsonrpc.on('openPopup', () => Promise.resolve(core.overlayManager.openPopup('dapplets')))

  if (!IS_IFRAME && !IS_LIBRARY) {
    // ToDo: inject in dapplets store only
    injectScript(browser.runtime.getURL('inpage.js'))
  }

  if (IS_LIBRARY && shareLinkPayload && !shareLinkPayload.isAllOk) {
    confirmShareLink(shareLinkPayload)
  }

  console.log('[DAPPLETS]: Content script initialized.')
}

function injectScript(url: string) {
  try {
    const container = document.head || document.documentElement
    const scriptTag = document.createElement('script')
    scriptTag.setAttribute('async', 'false')
    scriptTag.src = url
    container.insertBefore(scriptTag, container.children[0])
    container.removeChild(scriptTag)
  } catch (error) {
    console.error('[DAPPLETS]: Dapplets API injection failed.', error)
  }
}

// ToDo: move to background
async function confirmShareLink(payload: ShareLinkPayload) {
  const { moduleId, registry, contextIds } = payload
  const {
    getModuleInfoByName,
    containsTrustedUser,
    getRegistries,
    getActiveModulesByHostnames,
    addRegistry,
    enableRegistry,
    addTrustedUser,
    activateFeature,
    reloadFeature,
    reloadCurrentPage,
  } = await initBGFunctions(browser)

  const registries = await getRegistries()
  const targetRegistry = registries.find((x) => x.url === registry)
  const isRegistryExists = !!targetRegistry
  if (!isRegistryExists) {
    await addRegistry(registry, false)
  }

  const isRegistryEnabled = isRegistryExists && targetRegistry.isEnabled
  if (!isRegistryEnabled) {
    await enableRegistry(registry)
    await reloadCurrentPage()
  }

  const targetModuleId = parseModuleName(moduleId)
  const mi = await getModuleInfoByName(registry, targetModuleId.name)
  if (!mi)
    throw new Error(
      `ShareLink: Cannot find the module "${targetModuleId.name}" in the registry "${registry}"`
    )

  const isTrustedUser = await containsTrustedUser(mi.author)
  const isRegistryDev = isRegistryExists && targetRegistry.isDev
  const isTrustedUserExists = isTrustedUser || isRegistryDev
  if (!isTrustedUserExists) {
    await addTrustedUser(mi.author)
    await reloadCurrentPage()
  }

  // const isTrustedUserEnabled = true || isRegistryDev; // ToDo: use targetTrustedUser.isEnabled when Trusted User (de)activation feature will be done.
  // ToDo: enable trusted user
  // if (!s.isTrustedUserEnabled) { }

  const activeModules = await getActiveModulesByHostnames(contextIds)
  const activeModule = activeModules.find(
    (x) => x.name === targetModuleId.name && x.branch === targetModuleId.branch
  )
  const isModuleActivated = !!activeModule
  if (!isModuleActivated) {
    await activateFeature(targetModuleId.name, targetModuleId.version, contextIds, 0, registry)
  }

  const isModuleVersionEqual = isModuleActivated && activeModule.version === targetModuleId.version
  if (isModuleActivated && !isModuleVersionEqual) {
    await reloadFeature(targetModuleId.name, targetModuleId.version, contextIds, 0, registry)
  }
}

// ToDo: move to background
async function processShareLink() {
  const url = window.location.href
  const { urlNoPayload, payloadBase64 } = parseShareLink(url)
  if (!urlNoPayload || !payloadBase64) return

  // window.location.href = window.location.href.replace('#dapplet/' + payloadBase64, '');

  const payload = tryParseBase64Payload(payloadBase64)
  if (!payload) return

  const { moduleId, registry, contextIds } = payload
  const { getModuleInfoByName, containsTrustedUser, getRegistries, getActiveModulesByHostnames } =
    await initBGFunctions(browser)

  const registries = await getRegistries()
  const targetRegistry = registries.find((x) => x.url === registry)
  const isRegistryExists = !!targetRegistry
  if (!isRegistryExists) {
    return { ...payload, isAllOk: false }
  }

  const isRegistryEnabled = isRegistryExists && targetRegistry.isEnabled
  if (!isRegistryEnabled) {
    return { ...payload, isAllOk: false }
  }

  const targetModuleId = parseModuleName(moduleId)
  const mi = await getModuleInfoByName(registry, targetModuleId.name)
  if (!mi)
    throw new Error(
      `ShareLink: Cannot find the module "${targetModuleId.name}" in the registry "${registry}"`
    )

  const isTrustedUser = await containsTrustedUser(mi.author)
  const isRegistryDev = isRegistryExists && targetRegistry.isDev
  const isTrustedUserExists = isTrustedUser || isRegistryDev
  if (!isTrustedUserExists) {
    return { ...payload, isAllOk: false }
  }

  // const isTrustedUserEnabled = true || isRegistryDev; // ToDo: use targetTrustedUser.isEnabled when Trusted User (de)activation feature will be done.
  // ToDo: enable trusted user
  // if (!s.isTrustedUserEnabled) { }

  const activeModules = await getActiveModulesByHostnames(contextIds)
  const activeModule = activeModules.find(
    (x) => x.name === targetModuleId.name && x.branch === targetModuleId.branch
  )
  const isModuleActivated = !!activeModule
  if (!isModuleActivated) {
    return { ...payload, isAllOk: false }
  }

  const isModuleVersionEqual = isModuleActivated && activeModule.version === targetModuleId.version
  if (isModuleActivated && !isModuleVersionEqual) {
    return { ...payload, isAllOk: false }
  }

  return { ...payload, isAllOk: true }
}

// do not inject to overlays frames
if (!IS_OVERLAY_IFRAME && !IS_E2E_ENV) {
  if (window.document.body) {
    init()
  } else {
    window.addEventListener('DOMContentLoaded', () => init())
  }
}
