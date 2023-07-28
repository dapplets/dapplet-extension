import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useEffect, useMemo, useState } from 'react'
import browser from 'webextension-polyfill'
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
import { TabLoader } from '../../components/TabLoader'
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
  getTabsForDapplet: any
  handleCloseTabClick?: any
  tabs?: any
  setModule: any
  classNameBlock?: string
  overlays: any
  pathname: string
  navigate: any
}

export const Dapplets = ({
  onUserSettingsClick,
  dropdownListValue,
  setDropdownListValue,
  getTabsForDapplet,
  handleCloseTabClick,
  tabs,
  setModule,
  classNameBlock,
  overlays,
  pathname,
  navigate,
  search,
}: DappletsProps) => {
  // todo: loaded to app and
  const [dapplets, setDapplets] = useState<ManifestAndDetails[] | null>([])
  const [isLoadingListDapplets, setLoadingListDapplets] = useState(false)
  const [isNoContentScript, setNoContentScript] = useState<boolean>(null)

  useEffect(() => {
    const init = async () => {
      setLoadingListDapplets(true)

      await _refreshData()

      setLoadingListDapplets(false)
    }

    init()

    if (dapplets.length === 0) {
      setLoadingListDapplets(true)
    } else {
      setLoadingListDapplets(false)
    }
    return () => {}
  }, [dropdownListValue])

  useEffect(() => {
    EventBus.on('context_started', _refreshData)
    EventBus.on('context_finished', _refreshData)

    return () => {
      EventBus.off('context_started', _refreshData)
      EventBus.off('context_finished', _refreshData)
    }
  }, [])

  // Refresh isActive switch state
  useEffect(() => {
    const handler = (m) => {
      setDapplets((dapplets) => {
        return dapplets.map((dapplet) => {
          if (dapplet.name === m.name) {
            return { ...dapplet, isActive: true }
          } else {
            return dapplet
          }
        })
      })
    }

    EventBus.on('dapplet_activated', handler)

    return () => EventBus.off('dapplet_activated', handler)
  }, [])

  // Refresh isActive switch state
  useEffect(() => {
    const handler = (m) => {
      setDapplets((dapplets) => {
        return dapplets.map((dapplet) => {
          if (dapplet.name === m.name) {
            return { ...dapplet, isActive: false }
          } else {
            return dapplet
          }
        })
      })
    }

    EventBus.on('dapplet_deactivated', handler)

    return () => EventBus.off('dapplet_deactivated', handler)
  }, [])

  const _refreshData = async () => {
    try {
      //todo: must be in app
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
      // todo: end

      // todo:  get old state  and condition to old state for new state
      setModule(newDappletsList)

      setDapplets(newDappletsList)

      newDappletsList.map((x) => {
        if (x.isActive) getTabsForDapplet(x)
      })
    } catch (err) {
      console.error(err)
      setNoContentScript(true)
    }
  }

  const _updateFeatureState = (name: string, f: Partial<ManifestAndDetails>) => {
    setDapplets((dapplets) => {
      return dapplets.map((dapplet) => {
        if (dapplet.name == name) {
          const copy = { ...dapplet }
          Object.entries(f).forEach(([k, v]) => (copy[k] = v))
          return copy
        } else {
          return dapplet
        }
      })
    })
  }

  const onOpenDappletAction = async (f: ManifestAndDetails) => {
    try {
      const isOverlayActive = overlays.find((x) => x.source === f.name)
      if ((pathname.includes('system') && overlays.lenght === 0) || !isOverlayActive) {
        _updateFeatureState(f.name, { isActionLoading: true })
        const { openDappletAction, getCurrentTab } = await initBGFunctions(browser)
        const tab = await getCurrentTab()
        if (!tab) return
        await openDappletAction(f.name, tab.id)
      } else {
        overlays.filter((x) => x.source === f.name).map((x) => navigate!(`/${f.name}/${x.id}`))
      }
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
    if (selectVersions && isActive) {
      _updateFeatureState(name, { isLoading: true })
      const { getVersions } = await initBGFunctions(browser)
      const allVersions = await getVersions(module.sourceRegistry.url, module.name)
      _updateFeatureState(name, { versions: allVersions, isLoading: false })
      return
    } else {
      await toggleFeature(module, null, isActive, order)
    }
    isLoad()
  }

  const toggleFeature = async (
    module: Module,
    version: string | null,
    isActive: boolean,
    order: number
  ) => {
    const { name, hostnames, sourceRegistry } = module
    const { activateFeature, deactivateFeature } = await initBGFunctions(browser)

    _updateFeatureState(name, {
      isActive,
      isLoading: true,
      activeVersion: isActive ? version : null,
    })

    const isEverywhere = true
    const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : hostnames

    try {
      if (isActive) {
        const { isActionHandler, isHomeHandler } = await activateFeature(
          name,
          version,
          targetContextIds,
          order,
          sourceRegistry.url
        )
        getTabsForDapplet(module)
        _updateFeatureState(name, { isLoading: false, isActionHandler, isHomeHandler })
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

        _updateFeatureState(name, {
          isLoading: false,
          isActionHandler: false,
          isHomeHandler: false,
        })
      }
    } catch (err) {
      console.error(err)
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
      {/* todo: uncomment filter when will be more dapplets */}
      {/* <div className={styles.wrapper}>
        <Dropdown
          list={DROPDOWN_LIST}
          title="Filter:"
          value={dropdownListValue}
          onChange={setDropdownListValue}
        />
      </div> */}
      {isLoadingListDapplets ? (
        <TabLoader />
      ) : (
        <div className={cn(styles.dappletsBlock, classNameBlock)}>
          <DevMessage />
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
                      onSwitchChange={onSwitchChange}
                      onSettingsModule={onUserSettingsClick}
                      onOpenDappletAction={onOpenDappletAction}
                      onRemoveMyDapplet={dapplet.isMyDapplet ? onRemoveMyDapplet : undefined}
                      onOpenStore={onOpenStore}
                      onOpenNft={onOpenNft}
                      onOpenStoreAuthor={onOpenStoreAuthor}
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
