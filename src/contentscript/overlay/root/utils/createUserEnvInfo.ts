import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { getRegistriesInfo } from '../../../'
import { ManifestAndDetails } from '../../../../common/types'

type TUserEnvInfo = {
  dapplet: {
    name: string
    userVersion: string
    lastVersion: string
    author: string
    registry: string
  }
  context: string[]
  extension: string
  browser: string
  system: string
  userAgent: string
  activeAdapters: {
    name: string
    version: string
  }[]
}

export const createUserEnvInfo = async (
  dapplet: ManifestAndDetails & {
    users: any[]
    website: string
    isFavourites: boolean
  }
): Promise<TUserEnvInfo> => {
  const { getUserAgentName } = await initBGFunctions(browser)
  const userAgentNameInput = await getUserAgentName()
  const registries = getRegistriesInfo()
  const activeAdaptersInfo = registries.filter((m) => m.manifest.type === 'ADAPTER')
  const { userAgent, platform } = window.navigator
  return {
    dapplet: {
      name: dapplet.name,
      userVersion: dapplet.activeVersion,
      lastVersion: dapplet.lastVersion,
      author: dapplet.author,
      registry: dapplet.sourceRegistry.url,
    },
    context: dapplet.hostnames,
    extension: EXTENSION_VERSION,
    browser: userAgent,
    system: platform,
    userAgent: userAgentNameInput,
    activeAdapters: activeAdaptersInfo.map((a) => ({
      name: a.manifest.name,
      version: a.manifest.version,
    })),
  }
}
