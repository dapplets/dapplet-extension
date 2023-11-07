import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useMemo } from 'react'
import browser from 'webextension-polyfill'
import ManifestDTO from '../../../../../background/dto/manifestDTO'
import { AnalyticsGoals } from '../../../../../background/services/analyticsService'
import { CONTEXT_ID_WILDCARD, DAPPLETS_STORE_URL } from '../../../../../common/constants'
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
  // setDropdownListValue: (value: string) => void
  getTabsForDapplet: any
  handleCloseTabClick?: any
  tabs?: any
  modules: ManifestAndDetails[]
  setModule: any
  classNameBlock?: string
  overlays: any
  pathname: string
  navigate: any
  isLoadingListDapplets: boolean
  isNoContentScript: boolean
}

export const Dapplets = ({
  onUserSettingsClick,
  dropdownListValue,
  getTabsForDapplet,
  handleCloseTabClick,
  tabs,
  modules,
  setModule,
  classNameBlock,
  overlays,
  pathname,
  navigate,
  search,
  isLoadingListDapplets,
  isNoContentScript,
}: DappletsProps) => {
  const _updateFeatureState = (name: string, f: Partial<ManifestAndDetails>) => {
    setModule(
      modules.map((dapplet) => {
        if (dapplet.name == name) {
          const copy = { ...dapplet }
          Object.entries(f).forEach(([k, v]) => (copy[k] = v))
          return copy
        } else {
          return dapplet
        }
      })
    )
  }

  const onOpenDappletAction = async (f: ManifestAndDetails) => {
    try {
      const isOverlayActive = !!overlays && overlays.find((x) => x.source === f.name)
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

  const onSwitchChange = async (module: Module, order, selectVersions: boolean, isLoad) => {
    const { name, isActive } = module
    // TODO : try catch
    if (selectVersions && isActive) {
      _updateFeatureState(name, { isLoading: true })
      const { getVersions } = await initBGFunctions(browser)
      const allVersions = await getVersions(module.sourceRegistry.url, name)
      _updateFeatureState(name, { versions: allVersions, isLoading: false })
      return
    } else {
      await toggleFeature(module, order)
    }
    isLoad()
  }

  const toggleFeature = async (module: Module, order: number) => {
    const { name, sourceRegistry, isActive } = module
    const { activateFeature, deactivateFeature } = await initBGFunctions(browser)

    _updateFeatureState(name, {
      // isActive,
      isLoading: true,
      // activeVersion: null,
    })

    // const isEverywhere = true
    // const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : hostnames
    const targetContextIds = [CONTEXT_ID_WILDCARD]

    try {
      if (!isActive) {
        const response = await activateFeature(
          name,
          null,
          targetContextIds,
          order,
          sourceRegistry.url
        )
        if (response) {
          const { isActionHandler, isHomeHandler } = response
          getTabsForDapplet(module)
          _updateFeatureState(name, {
            isLoading: false,
            isActionHandler,
            isHomeHandler,
            isActive: true,
          })
        }
      } else {
        await deactivateFeature(name, null, targetContextIds, order, sourceRegistry.url)

        // ToDo: rethink overlay update when background state changes
        const noSystemTabs = tabs.filter((f) => f.title !== 'Dapplets')
        noSystemTabs.length > 0 &&
          noSystemTabs
            .filter((f) => f.id === name)
            .map((tab) => {
              handleCloseTabClick(tab)
            })

        _updateFeatureState(name, {
          isActive: false,
          isLoading: false,
          isActionHandler: false,
          isHomeHandler: false,
        })
      }
    } catch (err) {
      console.error(err)
      _updateFeatureState(name, { isActive: module.isActive, error: err.message })
    }
  }

  const onRemoveMyDapplet = async (f: ManifestAndDetails) => {
    const { removeMyDapplet } = await initBGFunctions(browser)
    await removeMyDapplet(f.sourceRegistry.url, f.name)
    const newDappletsList = modules.filter((x) => x.name !== f.name)

    setModule(newDappletsList)
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
    const _getFilteredDapplets = (dapplets) => {
      if (!search || search.length === 0) return dapplets

      const find = (a: string) => (a ?? '').toLowerCase().indexOf(search.toLowerCase()) !== -1

      return dapplets.filter(
        (x: ManifestAndDetails) => find(x.title) || find(x.description) || find(x.author)
      )
    }
    return _getFilteredDapplets(modules)
  }, [modules, search])

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
