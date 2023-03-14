import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { rcompare } from 'semver'
import { browser } from 'webextension-polyfill-ts'
import ManifestDTO from '../../../../../background/dto/manifestDTO'
import { AnalyticsGoals } from '../../../../../background/services/analyticsService'
import {
  CONTEXT_ID_WILDCARD,
  DAPPLETS_STORE_URL,
  ModuleTypes,
} from '../../../../../common/constants'
import * as EventBus from '../../../../../common/global-event-bus'
import { ManifestAndDetails } from '../../../../../common/types'
import { Dapplet } from '../../components/Dapplet'
import { Dropdown } from '../../components/Dropdown'
import { DROPDOWN_LIST } from '../../components/Dropdown/dropdown-list'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
import { openLink } from '../../utils/openLink'
import styles from './Dapplets.module.scss'
import { DevMessage } from './DevMessage'

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
    return () => {}
  }, [dropdownListValue, abortController.signal.aborted])

  useEffect(() => {
    EventBus.on('context_started', _refreshData)
    EventBus.on('context_finished', _refreshData)

    return () => {
      EventBus.off('context_started', _refreshData)
      EventBus.off('context_finished', _refreshData)
    }
  }, [])

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
      newDappletsList.map((x) => {
        if (x.isActive) getTabsForDapplet(x)
      })
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

        // ToDo: rethink overlay update when background state changes
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
  }

  const onRemoveMyDapplet = async (f: ManifestAndDetails) => {
    const { removeMyDapplet } = await initBGFunctions(browser)
    await removeMyDapplet(f.sourceRegistry.url, f.name)
    const newDappletsList = dapplets.filter((x) => x.name !== f.name)

    setDapplets(newDappletsList)
  }

  const onOpenStore = async (f: ManifestAndDetails) => {
    initBGFunctions(browser).then((x) =>
      x.track({
        idgoal: AnalyticsGoals.MovedToStore,
        dapplet: f.name,
      })
    )

    const url = `${DAPPLETS_STORE_URL}/#searchQuery=${f.name}`
    window.open(url, '_blank')
  }

  const onOpenNft = async (f: ManifestAndDetails) => {
    initBGFunctions(browser).then((x) =>
      x.track({
        idgoal: AnalyticsGoals.MovedToNftMarketplace,
        dapplet: f.name,
      })
    )

    const { getModuleNftUrl } = await initBGFunctions(browser)
    const nftUrl = await getModuleNftUrl(f.sourceRegistry.url, f.name)
    window.open(nftUrl, '_blank')
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

  const transitionLink = (x: string) => {
    return (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      openLink(x)
    }
  }
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
        <div
          className={cn(styles.dappletsBlock, classNameBlock)}
        >
          <DevMessage/>
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
                      onOpenStore={onOpenStore}
                      onOpenNft={onOpenNft}
                      onOpenStoreAuthor={onOpenStoreAuthor}
                      getTabsForDapplet={getTabsForDapplet}
                    />
                  )
              })
            ) : (
              <div className={styles.noDapplets}>
                {dropdownListValue === 'active' ? (
                  `You don't have active dapplets`
                ) : (
                  <>
                    No available dapplets for current site
                    <span>
                      There are dapplets for{' '}
                      <span
                        onClick={transitionLink('https://twitter.com/')}
                        className={styles.noDappletsLink}
                      >
                        twitter
                      </span>{' '}
                      and{' '}
                      <span
                        onClick={transitionLink('https://www.youtube.com/')}
                        className={styles.noDappletsLink}
                      >
                        youtube
                      </span>
                    </span>
                  </>
                )}
              </div>
            )
          ) : (
            <div className={styles.noDapplets}>No connection with context webpage.</div>
          )}
        </div>
      )}
    </>
  )
}
