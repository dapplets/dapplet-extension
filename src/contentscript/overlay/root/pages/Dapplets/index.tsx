import { initBGFunctions } from 'chrome-extension-message-wrapper'
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
import styles from './Dapplets.module.scss'

export type Module = ManifestDTO & {
  isLoading: boolean
  error: string
  versions: string[]
}
export interface DappletsProps {
  search: string
  onUserSettingsClick: (mi: ManifestDTO) => void
}

let _isMounted = false

export const Dapplets: FC<DappletsProps> = (props) => {
  const { search, onUserSettingsClick } = props
  const [dapplets, setDapplets] = useState<ManifestAndDetails[]>([])
  const [isLoading, setLoading] = useState<boolean>(null)
  const [isLoadingListDapplets, setLoadingListDapplets] = useState(false)
  const [error, setError] = useState<string>(null)
  const [isNoContentScript, setNoContentScript] = useState<boolean>(null)
  const [loadShowButton, setLoadShowButton] = useState(false)
  const [contextId, setContextIds] = useState<string[]>([])
  const [trustedUsers, setTrustedUsers] = useState([])
  const [dropdownListValue, setDropdownListValue] = useState('All')

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      const { getFeaturesByHostnames, getCurrentContextIds, getThisTab } = await initBGFunctions(
        browser
      )

      const currentTab = await getThisTab()

      const ids = await getCurrentContextIds(currentTab)

      setContextIds(ids)
      await _refreshDataByContext(ids)

      setLoadingListDapplets(false)

      await loadTrustedUsers()
    }

    init()

    if (dapplets.length === 0) {
      setLoadingListDapplets(true)
    } else {
      setLoadingListDapplets(false)
    }

    return () => {
      _isMounted = false
    }
  }, [])

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

    const { getFeaturesByHostnames, getRegistries } = await initBGFunctions(browser)

    const features: ManifestDTO[] = contextIdsValues
      ? await getFeaturesByHostnames(contextIdsValues)
      : []

    const registries = await getRegistries()
    const regsWithErrors = registries.filter((r) => !r.isDev && !!r.isEnabled && !!r.error)
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

  const _updateFeatureState = (name: string, f: any) => {
    const newDapplets = dapplets.map((feature) => {
      if (feature.name == name) {
        Object.entries(f).forEach(([k, v]) => (feature[k] = v))
      }

      return feature
    })

    setDapplets(newDapplets)
  }

  const refreshContextPage = async () => {
    const { getCurrentTab, getCurrentContextIds, reloadCurrentPage } = await initBGFunctions(
      browser
    )
    const tab = await getCurrentTab()
    if (!tab) return
    await reloadCurrentPage()
    setNoContentScript(false)

    setTimeout(() => _refreshDataByContext(getCurrentContextIds(dapplets)), 4000) // ToDo: get rid of timeout
  }

  const onOpenDappletAction = async (f: ManifestAndDetails) => {
    try {
      _updateFeatureState(f.name, { isActionLoading: true })
      const { openDappletAction, getCurrentTab } = await initBGFunctions(browser)
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

  const _getFilteredDapplets = (dapplets) => {
    if (!search || search.length === 0) return dapplets

    const find = (a: string) => (a ?? '').toLowerCase().indexOf(search.toLowerCase()) !== -1

    return dapplets.filter(
      (x: ManifestAndDetails) => find(x.title) || find(x.description) || find(x.author)
    )
  }

  const onSwitchChange = async (module: Module, isActive?, order?, selectVersions?: boolean) => {
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
  }

  const toggleFeature = async (
    module: Module,
    version: string | null,
    isActive: boolean,
    order: number,
    allVersions: string[] | null
  ) => {
    const { name, hostnames, sourceRegistry } = module
    const { getCurrentContextIds, getVersions, activateFeature, deactivateFeature, getThisTab } =
      await initBGFunctions(browser)

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
        await activateFeature(name, version, targetContextIds, order, sourceRegistry.url)
      } else {
        await deactivateFeature(name, version, targetContextIds, order, sourceRegistry.url)
      }

      const currentTab = await getThisTab()
      await _refreshDataByContext(await getCurrentContextIds(currentTab))
    } catch (err) {
      _updateFeatureState(name, { isActive: !isActive, error: err.message })
    }

    _updateFeatureState(name, { isLoading: false })
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
  const onOpenStoreAuthor = async (f: ManifestAndDetails) => {
    const url = `${DAPPLETS_STORE_URL}/#sortType=Sort%20A-Z&addressFilter=${f.author}`
    window.open(url, '_blank')
  }

  const loadTrustedUsers = async () => {
    const { getTrustedUsers } = await initBGFunctions(browser)
    const trustedUsers = await getTrustedUsers()
    setTrustedUsers(trustedUsers)
  }

  const _getSortedDapplets = (dapplets) => {
    if (dropdownListValue === 'All') return dapplets

    if (dropdownListValue === 'Local') {
      const find = (a: string) => (a ?? '').toLowerCase().indexOf(''.toLowerCase()) !== -1
      return dapplets.filter((x: ManifestAndDetails) => {
        if (x.isMyDapplet === true) return find(x.author)
      })
    }
    if (dropdownListValue === 'Trusted Users') {
      const find = (a: string) => (a ?? '').toLowerCase().indexOf(''.toLowerCase()) !== -1
      return dapplets.filter((x: ManifestAndDetails) => {
        if (x.author !== null) return find(x.author)
      })
    }
    if (dropdownListValue === 'Public') {
      const find = (a: string) => (a ?? '').toLowerCase().indexOf(''.toLowerCase()) !== -1
      return dapplets.filter((x: ManifestAndDetails) => {
        if (x.isUnderConstruction !== true) return find(x.author)
      })
    }
  }

  const filteredDapplets = useMemo(() => {
    return _getSortedDapplets(_getFilteredDapplets(dapplets))
  }, [search, dapplets, dropdownListValue])

  return (
    <>
      <div className={styles.wrapper}>
        <Dropdown
          list={DROPDOWN_LIST}
          title="filter:"
          value={{ label: dropdownListValue }}
          setDropdownListValue={setDropdownListValue}
        />
      </div>
      {isLoadingListDapplets ? (
        <TabLoader />
      ) : (
        <div className={styles.dappletsBlock}>
          {!isNoContentScript ? (
            filteredDapplets && filteredDapplets.length && filteredDapplets.length > 0 ? (
              filteredDapplets.map((dapplet) => {
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
                      onSettingsModule={onUserSettingsClick}
                      onOpenDappletAction={onOpenDappletAction}
                      onRemoveMyDapplet={dapplet.isMyDapplet ? onRemoveMyDapplet : undefined}
                      onDeployDapplet={onDeployDapplet}
                      onOpenStore={onOpenStore}
                      onOpenStoreAuthor={onOpenStoreAuthor}
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
