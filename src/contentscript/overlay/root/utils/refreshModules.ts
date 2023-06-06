import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import ManifestDTO from '../../../../background/dto/manifestDTO'
import { ModuleTypes } from '../../../../common/constants'
import { ManifestAndDetails } from '../../../../common/types'

export const getActualModules = async (filter = 'all'): Promise<ManifestAndDetails[]> => {
  const { getThisTab, getCurrentContextIds, getFeaturesByHostnames,getVersions } = await initBGFunctions(
    browser
  )
  const currentTab = await getThisTab()
  const contextIds = await getCurrentContextIds(currentTab)
  const features: ManifestDTO[] = contextIds ? await getFeaturesByHostnames(contextIds, filter) : []
  return features
    .filter((f) => f.type === ModuleTypes.Feature)
    .map((f) => ({
      ...f,
      isLoading: false,
      isActionLoading: false,
      isHomeLoading: false,
      error: null,
      versions: [],
    }))
}
