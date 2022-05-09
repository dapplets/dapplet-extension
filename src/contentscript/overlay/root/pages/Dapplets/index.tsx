import React, { useEffect, useState } from 'react'
import { Dropdown } from '../../components/Dropdown'
import { DROPDOWN_LIST } from '../../components/Dropdown/dropdown-list'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import styles from './Dapplets.module.scss'
import * as EventBus from '../../../../../common/global-event-bus'

import { Dapplet } from '../../components/Dapplet'
import ManifestDTO from '../../../../../background/dto/manifestDTO'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { browser } from 'webextension-polyfill-ts'
import { rcompare } from 'semver'
import {
  CONTEXT_ID_WILDCARD,
  ModuleTypes,
  DAPPLETS_STORE_URL,
} from '../../../../../common/constants'

export type Module = ManifestDTO & {
  isLoading: boolean
  error: string
  versions: string[]
}

let _isMounted = false

export const Dapplets = () => {
  const [dapplets, setDapplets] = useState<ManifestAndDetails[]>([])
  const [isLoading, setLoading] = useState<boolean>(null)
  const [isLoadingListDapplets, setLoadingLoadingListDapplets] = useState(false)
  const [error, setError] = useState<string>(null)
  const [isNoContentScript, setNoContentScript] = useState<boolean>(null)
  const [devMessage, setDevMessage] = useState<string>(null)
  const [loadShowButton, setLoadShowButton] = useState(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      // setLoadingLoadingListDapplets(true)
      const { getFeaturesByHostnames, getCurrentContextIds, getThisTab } =
        await initBGFunctions(browser)

      const currentTab = await getThisTab()

      const ids = await getCurrentContextIds(currentTab)

      const d = await getFeaturesByHostnames(ids)

      setDapplets(d)

      setLoadingLoadingListDapplets(false)
    }
    init()
    if (dapplets.length === 0) {
      setLoadingLoadingListDapplets(true)
    } else {
      setLoadingLoadingListDapplets(false)
    }

    EventBus.on('mydapplets_changed', init)
    EventBus.on('context_started', init)
    EventBus.on('context_finished', init)
    EventBus.on('dapplet_activated', init)
    EventBus.on('dapplet_deactivated', init)

    return () => {
      EventBus.off('mydapplets_changed', init)
      EventBus.off('context_started', init)
      EventBus.off('context_finished', init)
      EventBus.off('dapplet_activated', init)
      EventBus.off('dapplet_deactivated', init)
      _isMounted = false
    }
  }, [])

  const onSwitchChange = async (
    module: Module,
    isActive?,
    order?,
    selectVersions?: boolean
  ) => {
    const { name } = module

    if (selectVersions && isActive) {
      setLoadShowButton(true)
      _updateFeatureState(name, { isLoading: true })
      const { getVersions } = await initBGFunctions(browser)
      const allVersions = await getVersions(
        module.sourceRegistry.url,
        module.name
      )
      _updateFeatureState(name, { versions: allVersions, isLoading: false })
      return setLoadShowButton(false)
    } else {
      setLoadShowButton(true)
      await toggleFeature(module, null, isActive, order, null)
      setLoadShowButton(false)
    }
  }

  const toggleFeature = async (
    module: Module,
    version: string | null,
    isActive: boolean,
    order: number,
    allVersions: string[] | null
  ) => {
    const { name, hostnames, sourceRegistry } = module
    const {
      getCurrentContextIds,
      getVersions,
      activateFeature,
      deactivateFeature,
      getThisTab,
    } = await initBGFunctions(browser)

    _updateFeatureState(name, { isActive, isLoading: true })

    if (!version || !allVersions) {
      allVersions = await getVersions(module.sourceRegistry.url, module.name)
      version = allVersions.sort(rcompare)[0]
    }

    _updateFeatureState(name, {
      isActive,
      isLoading: true,
      error: null,
      ersions: [],
      activeVersion: isActive ? version : null,
      lastVersion: allVersions.sort(rcompare)[0],
    })

    const isEverywhere = true
    const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : hostnames

    try {
      if (isActive) {
        await activateFeature(
          name,
          version,
          targetContextIds,
          order,
          sourceRegistry.url
        )
      } else {
        await deactivateFeature(
          name,
          version,
          targetContextIds,
          order,
          sourceRegistry.url
        )
      }

      const currentTab = await getThisTab()
      await _refreshDataByContext(await getCurrentContextIds(currentTab))
    } catch (err) {
      _updateFeatureState(name, { isActive: !isActive, error: err.message })
    }

    _updateFeatureState(name, { isLoading: false })
  }

  const _updateFeatureState = (name: string, f: any) => {
    const newDapplets = dapplets.map((feature) => {
      if (feature.name == name) {
        Object.entries(f).forEach(([k, v]) => (feature[k] = v))
      }
      return feature
    })

    setDapplets(newDapplets)
  }

  const _refreshDataByContext = async (contextIds: Promise<string[]>) => {
    let contextIdsValues = undefined

    try {
      contextIdsValues = await contextIds
    } catch (err) {
      console.error(err)
      setNoContentScript(true)
      setLoading(false)
      return
    }

    const { getFeaturesByHostnames, getRegistries } = await initBGFunctions(
      browser
    )

    const features: ManifestDTO[] = contextIdsValues
      ? await getFeaturesByHostnames(contextIdsValues)
      : []

    const registries = await getRegistries()
    const regsWithErrors = registries.filter(
      (r) => !r.isDev && !!r.isEnabled && !!r.error
    )
    if (regsWithErrors.length > 0) {
      const isProviderProblems =
        regsWithErrors.filter(
          ({ error }) =>
            error.includes('missing response') ||
            error.includes('could not detect network') ||
            error.includes('resolver or addr is not configured for ENS name') ||
            error.includes('invalid contract address or ENS name')
        ).length > 0

      const description = isProviderProblems
        ? 'It looks like the blockchain provider is not available. Check provider addresses in the settings, or try again later.'
        : 'Please check the settings.'

      setError(
        `Cannot connect to the Dapplet Registry (${regsWithErrors
          .map((x) => x.url)
          .join(', ')}).\n${description}`
      )
    }

    if (_isMounted) {
      // setLoadingLoadingListDapplets(false)
      const d = features
        .filter((f) => f.type === ModuleTypes.Feature)
        .map((f) => ({
          ...f,
          isLoading: false,
          isActionLoading: false,
          isHomeLoading: false,
          error: null,
          versions: [],
        }))

      setDapplets(d)
      setLoading(false)
    }
  }

  const onOpenSettingsModule = async (mi: ManifestDTO) => {
    const { openSettingsOverlay } = await initBGFunctions(browser)
    await openSettingsOverlay(mi)
    console.log(mi)

    window.close()
  }

  const onOpenDappletAction = async (f: ManifestAndDetails) => {
    try {
      _updateFeatureState(f.name, { isActionLoading: true })
      const { openDappletAction, getCurrentTab } = await initBGFunctions(
        browser
      )
      const tab = await getCurrentTab()
      if (!tab) return
      await openDappletAction(f.name, tab.id)
      window.close()
    } catch (err) {
      console.error(err)
    } finally {
      _updateFeatureState(f.name, { isActionLoading: false })
    }
  }

  const onRemoveMyDapplet = async (f: ManifestAndDetails) => {
    const { removeMyDapplet } = await initBGFunctions(browser)
    await removeMyDapplet(f.sourceRegistry.url, f.name)
    const d = dapplets.filter((x) => x.name !== f.name)
    setDapplets(d)
  }

  const onDeployDapplet = async (f: ManifestAndDetails) => {
    const { openDeployOverlay } = await initBGFunctions(browser)

    // TODO: activeVersion or lastVersion
    await openDeployOverlay(f, f.activeVersion)
    window.close()
  }

  const onOpenStore = async (f: ManifestAndDetails) => {
    const url = `${DAPPLETS_STORE_URL}/#searchQuery=${f.name}`
    window.open(url, '_blank')
  }

  return (
    <>
      <div className={styles.wrapper}>
        <Dropdown
          list={DROPDOWN_LIST}
          title="Sort by:"
          style={{ marginRight: 10 }}
        />
        <Dropdown list={DROPDOWN_LIST} title="Worklist:" />
      </div>
      {isLoadingListDapplets ? (
        <div className={styles.loadingListDapplets}></div>
      ) : (
        <div className={styles.dappletsBlock}>
          {dapplets &&
            dapplets.map((dapplet) => {
              if (dapplet.type !== 'FEATURE') {
                return
              } else
                return (
                  <Dapplet
                    key={dapplet.name}
                    dapplet={{
                      ...dapplet,
                      isFavourites: false,
                      website: 'dapplets.com',
                      users: [],
                    }}
                    loadShowButton={loadShowButton}
                    onSwitchChange={onSwitchChange}
                    onSettingsModule={onOpenSettingsModule}
                    onOpenDappletAction={onOpenDappletAction}
                    onRemoveMyDapplet={
                      dapplet.isMyDapplet ? onRemoveMyDapplet : undefined
                    }
                    onDeployDapplet={onDeployDapplet}
                    onOpenStore={onOpenStore}
                  />
                )
            })}
        </div>
      )}
    </>
  )
}
