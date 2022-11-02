import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { rcompare } from 'semver'
import { browser } from 'webextension-polyfill-ts'
import ManifestDTO from '../../../../../background/dto/manifestDTO'
import {
  CONTEXT_ID_WILDCARD,
  DAPPLETS_STORE_URL,
  ModuleTypes,
} from '../../../../../common/constants'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { Dapplet } from '../../components/Dapplet'
import { Dropdown } from '../../components/Dropdown'
import { DROPDOWN_LIST } from '../../components/Dropdown/dropdown-list'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
import styles from './Dapplets.module.scss'
export type Module = ManifestDTO & {
  isLoading: boolean
  error: string
  versions: string[]
}
export interface DappletsProps {
  search: string
  onUserSettingsClick: (mi: ManifestDTO) => void
  dropdownListValue: string
  setDropdownListValue: (value: string) => void
  getTabsForDapplet?: any
  handleCloseTabClick?: any
  tabs?: any
  setModule: any
  classNameBlock?: string
}

export const Dapplets: FC<DappletsProps> = (props) => {
  const {
    search,
    onUserSettingsClick,
    dropdownListValue,
    setDropdownListValue,
    getTabsForDapplet,
    handleCloseTabClick,
    tabs,
    setModule,
    classNameBlock,
  } = props
  const [dapplets, setDapplets] = useState<ManifestAndDetails[]>([])

  const [isLoadingListDapplets, setLoadingListDapplets] = useState(false)

  const [isNoContentScript, setNoContentScript] = useState<boolean>(null)
  const [loadShowButton, setLoadShowButton] = useState(false)

  const abortController = useAbortController()
  // useEffect(() => {
  //   const init = async () => {
  //     await _refreshData()
  //     if (!abortController.signal.aborted) {
  //       setLoadingListDapplets(false)
  //     }
  //     await loadTrustedUsers()
  //   }

  //   init()

  //   // if (dapplets.length === 0) {
  //   //   setLoadingListDapplets(true)
  //   // } else {
  //   //   setLoadingListDapplets(false)
  //   // }

  //   return () => {
  //     // abortController.abort()
  //   }
  // }, [abortController.signal.aborted])

  useEffect(() => {
    const init = async () => {
      if (!abortController.signal.aborted) {
        setLoadingListDapplets(true)
      }
      await _refreshData()
      if (!abortController.signal.aborted) {
        setLoadingListDapplets(false)
      }

      await loadTrustedUsers()
    }

    init()

    if (dapplets.length === 0) {
      setLoadingListDapplets(true)
    } else {
      setLoadingListDapplets(false)
    }
    return () => {
      // _isMounted.current = false
      // abortController.abort()
    }
  }, [dropdownListValue, abortController.signal.aborted])

  const _refreshData = async () => {
    try {
      const { getThisTab, getCurrentContextIds, getFeaturesByHostnames } = await initBGFunctions(
        browser
      )

      const currentTab = await getThisTab()
      const contextIds = await getCurrentContextIds(currentTab)

      const features: ManifestDTO[] = contextIds
        ? await getFeaturesByHostnames(contextIds, dropdownListValue)
        : []

      const newDappletsList = features
        .filter((f) => f.type === ModuleTypes.Feature)
        .map((f) => ({
          ...f,
          isLoading: false,
          isActionLoading: false,
          isHomeLoading: false,
          error: null,
          versions: [],
        }))
      setModule(newDappletsList)
      if (!abortController.signal.aborted) {
        setDapplets(newDappletsList)
      }
    } catch (err) {
      console.error(err)
      setNoContentScript(true)
    }
  }

  const _updateFeatureState = (name: string, f: any) => {
    const newDapplets = dapplets.map((feature) => {
      if (feature.name == name) {
        Object.entries(f).forEach(([k, v]) => (feature[k] = v))
      }

      return feature
    })
    return newDapplets
  }

  const onOpenDappletAction = async (f: ManifestAndDetails) => {
    try {
      _updateFeatureState(f.name, { isActionLoading: true })
      const { openDappletAction, getCurrentTab } = await initBGFunctions(browser)
      const tab = await getCurrentTab()

      if (!tab) return
      await openDappletAction(f.name, tab.id)
    } catch (err) {
      console.error(err)
    } finally {
      _updateFeatureState(f.name, { isActionLoading: false })
    }
  }

  const _getFilteredDapplets = (dapplets) => {
    if (!search || search.length === 0) return dapplets

    const find = (a: string) => (a ?? '').toLowerCase().indexOf(search.toLowerCase()) !== -1

    return dapplets.filter(
      (x: ManifestAndDetails) => find(x.title) || find(x.description) || find(x.author)
    )
  }

  const onSwitchChange = async (
    module: Module,
    isActive,
    order,
    selectVersions: boolean,
    isLoad
  ) => {
    const { name } = module
    // TODO : try catch
    setLoadShowButton(true)
    if (selectVersions && isActive) {
      _updateFeatureState(name, { isLoading: true })
      const { getVersions } = await initBGFunctions(browser)
      const allVersions = await getVersions(module.sourceRegistry.url, module.name)
      _updateFeatureState(name, { versions: allVersions, isLoading: false })
      return
    } else {
      await toggleFeature(module, null, isActive, order, null)
    }
    setLoadShowButton(false)
    isLoad()
  }

  const toggleFeature = async (
    module: Module,
    version: string | null,
    isActive: boolean,
    order: number,
    allVersions: string[] | null
  ) => {
    const { name, hostnames, sourceRegistry } = module
    const { getVersions, activateFeature, deactivateFeature } = await initBGFunctions(browser)

    _updateFeatureState(name, { isActive, isLoading: true })

    if (!version || !allVersions) {
      allVersions = await getVersions(module.sourceRegistry.url, module.name)
      version = allVersions.sort(rcompare)[0]
    }

    _updateFeatureState(name, {
      isActive,
      isLoading: true,
      error: null,
      versions: [],
      activeVersion: isActive ? version : null,
      lastVersion: allVersions.sort(rcompare)[0],
    })

    const isEverywhere = true
    const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : hostnames

    try {
      if (isActive) {
        await activateFeature(name, version, targetContextIds, order, sourceRegistry.url)
        getTabsForDapplet(module)
      } else {
        await deactivateFeature(name, version, targetContextIds, order, sourceRegistry.url)
        const noSystemTabs = tabs.filter((f) => f.title !== 'Dapplets')
        noSystemTabs.length > 0 &&
          noSystemTabs
            .filter((f) => f.id === name)
            .map((tab) => {
              handleCloseTabClick(tab)
            })
      }

      await _refreshData()
      _updateFeatureState(name, { isLoading: false })
    } catch (err) {
      _updateFeatureState(name, { isActive: !isActive, error: err.message })
    }

    // _updateFeatureState(name, { isLoading: false })
  }

  const onRemoveMyDapplet = async (f: ManifestAndDetails) => {
    const { removeMyDapplet } = await initBGFunctions(browser)
    await removeMyDapplet(f.sourceRegistry.url, f.name)
    const newDappletsList = dapplets.filter((x) => x.name !== f.name)

    setDapplets(newDappletsList)
  }

  const onDeployDapplet = async (f: ManifestAndDetails) => {
    const { openDeployOverlay } = await initBGFunctions(browser)

    // TODO: activeVersion or lastVersion
    await openDeployOverlay(f, f.activeVersion)
  }

  const onOpenStore = async (f: ManifestAndDetails) => {
    const url = `${DAPPLETS_STORE_URL}/#searchQuery=${f.name}`
    window.open(url, '_blank')
  }
  const onOpenStoreAuthor = async (f: ManifestAndDetails) => {
    const url = `${DAPPLETS_STORE_URL}/#sortType=Sort%20A-Z&addressFilter=${f.author}`
    window.open(url, '_blank')
  }

  const loadTrustedUsers = async () => {
    const { getTrustedUsers } = await initBGFunctions(browser)
    const trustedUsers = await getTrustedUsers()
  }

  const filteredDapplets = useMemo(() => {
    return _getFilteredDapplets(dapplets)
  }, [search, dapplets])

  return (
    <>
      <div className={styles.wrapper}>
        <Dropdown
          list={DROPDOWN_LIST}
          title="Filter:"
          value={dropdownListValue}
          onChange={setDropdownListValue}
        />
      </div>
      {isLoadingListDapplets ? (
        <TabLoader />
      ) : (
        <div className={cn(styles.dappletsBlock, classNameBlock)}>
          {!isNoContentScript ? (
            filteredDapplets && filteredDapplets.length && filteredDapplets.length > 0 ? (
              filteredDapplets.map((dapplet, i) => {
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
                      index={i}
                      loadShowButton={loadShowButton}
                      onSwitchChange={onSwitchChange}
                      onSettingsModule={onUserSettingsClick}
                      onOpenDappletAction={onOpenDappletAction}
                      onRemoveMyDapplet={dapplet.isMyDapplet ? onRemoveMyDapplet : undefined}
                      onDeployDapplet={onDeployDapplet}
                      onOpenStore={onOpenStore}
                      onOpenStoreAuthor={onOpenStoreAuthor}
                      getTabsForDapplet={getTabsForDapplet}
                    />
                  )
              })
            ) : (
              <div>No available features for current site.</div>
            )
          ) : (
            <div>No connection with context webpage.</div>
          )}
        </div>
      )}
    </>
  )
}
