import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import { Button, Icon, Input, List, Message, Segment } from 'semantic-ui-react'
import { rcompare } from 'semver'
import { browser } from 'webextension-polyfill-ts'
import ManifestDTO from '../../background/dto/manifestDTO'
import Manifest from '../../background/models/manifest'
import { CONTEXT_ID_WILDCARD, DEFAULT_BRANCH_NAME, ModuleTypes } from '../../common/constants'
import * as EventBus from '../../common/global-event-bus'
import { Dapplet, ManifestAndDetails } from '../components/dapplet'
import { DevMessage } from '../components/DevMessage'

interface IDappletsProps {
  isOverlay: boolean
  currentTab: { id: number; windowId: number } | null
}

interface IDappletsState {
  features: ManifestAndDetails[]
  isLoading: boolean
  error: string
  isNoContentScript: boolean
  search: string
  devMessage: string
  contextIds: string[]
}

class Dapplets extends React.Component<IDappletsProps, IDappletsState> {
  private _isMounted = false

  state = {
    features: [],
    isLoading: true,
    error: null,
    isNoContentScript: false,
    search: '',
    devMessage: null,
    contextIds: [],
  }

  async componentDidMount() {
    this._isMounted = true

    EventBus.on('context_started', this.refresh)
    EventBus.on('context_finished', this.refresh)
    EventBus.on('dapplet_activated', this.refresh)
    EventBus.on('dapplet_deactivated', this.refresh)

    await this.refresh()
  }

  componentWillUnmount() {
    this._isMounted = false

    EventBus.off('context_started', this.refresh)
    EventBus.off('context_finished', this.refresh)
    EventBus.off('dapplet_activated', this.refresh)
    EventBus.off('dapplet_deactivated', this.refresh)
  }

  refresh = async () => {
    const { getCurrentContextIds } = await initBGFunctions(browser)
    const contextIds = await getCurrentContextIds(this.props.currentTab)
    if (this._isMounted) {
      this.setState({ contextIds })
      await this._refreshDataByContext(contextIds)
    }
  }

  async _refreshDataByContext(contextIdsValues: string[]) {
    const { getFeaturesByHostnames, getRegistries } = await initBGFunctions(browser)

    const features: ManifestDTO[] = contextIdsValues
      ? await getFeaturesByHostnames(contextIdsValues, null)
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

      this.setState({
        error: `Cannot connect to the Dapplet Registry (${regsWithErrors
          .map((x) => x.url)
          .join(', ')}).\n${description}`,
      })
    }

    if (this._isMounted) {
      this.setState({
        features: features
          .filter((f) => f.type === ModuleTypes.Feature)
          .map((f) => ({
            ...f,
            isLoading: false,
            isActionLoading: false,
            isHomeLoading: false,
            error: null,
            versions: [],
          })),
        isLoading: false,
      })
    }
  }

  async handleSwitchChange(
    module: ManifestDTO & {
      isLoading: boolean
      error: string
      versions: string[]
    },
    isActive,
    order,
    selectVersions: boolean
  ) {
    const { name } = module

    if (selectVersions && isActive) {
      this._updateFeatureState(name, { isLoading: true })
      const { getVersions } = await initBGFunctions(browser)
      const allVersions = await getVersions(module.sourceRegistry.url, module.name)
      this._updateFeatureState(name, {
        versions: allVersions,
        isLoading: false,
      })
      return
    } else {
      await this.toggleFeature(module, null, isActive, order, null)
    }
  }

  async toggleFeature(
    module: ManifestDTO & {
      isLoading: boolean
      error: string
      versions: string[]
    },
    version: string | null,
    isActive: boolean,
    order: number,
    allVersions: string[] | null
  ) {
    const { name, hostnames, sourceRegistry } = module

    this._updateFeatureState(name, { isActive, isLoading: true })

    if (!version || !allVersions) {
      const { getVersions } = await initBGFunctions(browser)
      allVersions = await getVersions(module.sourceRegistry.url, module.name)
      version = allVersions.sort(rcompare)[0]
    }

    const { activateFeature, deactivateFeature } = await initBGFunctions(browser)

    this._updateFeatureState(name, {
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
      } else {
        await deactivateFeature(name, version, targetContextIds, order, sourceRegistry.url)
      }

      await this._refreshDataByContext(this.state.contextIds)
    } catch (err) {
      this._updateFeatureState(name, {
        isActive: !isActive,
        error: err.message,
      })
    }

    this._updateFeatureState(name, { isLoading: false })
  }

  private _updateFeatureState(name: string, f: any) {
    this.setState((state) => {
      const features = state.features.map((feature) => {
        if (feature.name == name) {
          Object.entries(f).forEach(([k, v]) => (feature[k] = v))
        }
        return feature
      })

      return { features }
    })
  }

  async refreshContextPage() {
    const { getCurrentTab, getCurrentContextIds, reloadCurrentPage } = await initBGFunctions(
      browser
    )
    const tab = await getCurrentTab()
    if (!tab) return
    await reloadCurrentPage()
    this.setState({ isNoContentScript: false, isLoading: true })
    setTimeout(() => this._refreshDataByContext(getCurrentContextIds(this.props.currentTab)), 4000) // ToDo: get rid of timeout
  }

  async settingsModule(mi: ManifestDTO) {
    const { openSettingsOverlay } = await initBGFunctions(browser)
    await openSettingsOverlay(mi)
    window.close()
  }

  openDappletAction = async (f: ManifestAndDetails) => {
    try {
      this._updateFeatureState(f.name, { isActionLoading: true })
      const { openDappletAction, getCurrentTab } = await initBGFunctions(browser)
      const tab = await getCurrentTab()
      if (!tab) return
      await openDappletAction(f.name, tab.id)
      window.close()
    } catch (err) {
      console.error(err)
    } finally {
      this._updateFeatureState(f.name, { isActionLoading: false })
    }
  }

  openDappletHome = async (f: ManifestAndDetails) => {
    try {
      this._updateFeatureState(f.name, { isHomeLoading: true })
      const { openDappletHome, getCurrentTab } = await initBGFunctions(browser)
      const tab = await getCurrentTab()
      if (!tab) return
      await openDappletHome(f.name, tab.id)
      window.close()
    } catch (err) {
      console.error(err)
    } finally {
      this._updateFeatureState(f.name, { isHomeLoading: false })
    }
  }

  removeDapplet = async (f: Manifest) => {
    const { removeDapplet } = await initBGFunctions(browser)
    const contextIds = await this.state.contextIds
    await removeDapplet(f.name, contextIds)
    this.setState({
      features: this.state.features.filter((x) => x.name !== f.name),
    })
  }

  _searchChangeHandler(value: string) {
    this.setState({ search: value })
  }

  _getFilteredDapplets() {
    const { features, search } = this.state
    if (!search || search.length === 0) return features

    const find = (a: string) => (a ?? '').toLowerCase().indexOf(search.toLowerCase()) !== -1
    return features.filter(
      (x: ManifestAndDetails) =>
        find(x.name) || find(x.title) || find(x.description) || find(x.author)
    )
  }

  async deployModule(f: ManifestAndDetails, v: string) {
    const { openDeployOverlay, getModuleInfoByName, getVersionInfo } = await initBGFunctions(
      browser
    )
    const mi = await getModuleInfoByName(f.sourceRegistry.url, f.name)
    const vi = await getVersionInfo(f.sourceRegistry.url, f.name, DEFAULT_BRANCH_NAME, v)
    await openDeployOverlay(mi, vi)
    window.close()
  }

  render() {
    const { isLoading, error, isNoContentScript, search } = this.state
    const features = this._getFilteredDapplets()

    return (
      <React.Fragment>
        <div className={this.props.isOverlay ? undefined : 'internalTabColumn'}>
          <DevMessage style={{ marginBottom: '10px' }} isOverlay={this.props.isOverlay} />

          {error ? (
            <Message
              error
              content={error.split('\n').map((x) => (
                <>
                  {x}
                  <br />
                </>
              ))}
            />
          ) : null}

          {!isLoading ? (
            <Input fluid iconPosition="left" icon placeholder="Search...">
              <Icon name="search" />
              <input
                value={search}
                onChange={(e) => {
                  this._searchChangeHandler(e.target.value)
                }}
              />
              {search.length > 0 ? (
                <Icon
                  name="close"
                  link
                  style={{ right: '1px', left: 'initial' }}
                  onClick={() => this._searchChangeHandler('')}
                />
              ) : null}
            </Input>
          ) : null}

          <Segment
            loading={isLoading}
            style={{ flex: 'auto', overflowY: 'auto', minHeight: '90px' }}
          >
            {!isNoContentScript ? (
              features.length > 0 ? (
                <List divided relaxed>
                  {features.map((f, i) => (
                    <Dapplet
                      key={f.name}
                      index={i}
                      feature={f}
                      onSwitchChange={this.handleSwitchChange.bind(this)}
                      onSettingsModule={this.settingsModule.bind(this)}
                      onOpenDappletAction={this.openDappletAction.bind(this)}
                      onOpenDappletHome={this.openDappletHome.bind(this)}
                      onToggleFeature={this.toggleFeature.bind(this)}
                      onRemoveDapplet={this.removeDapplet.bind(this)}
                      onDeployClick={this.deployModule.bind(this)}
                    />
                  ))}
                </List>
              ) : (
                <div>No available dapplets for current site.</div>
              )
            ) : (
              <div>
                No connection with context webpage.
                <br />
                Please refresh it.
                <br />
                <Button
                  compact
                  size="tiny"
                  color="blue"
                  content="Refresh"
                  onClick={() => this.refreshContextPage()}
                  style={{ marginTop: '6px' }}
                />
              </div>
            )}
          </Segment>
        </div>
      </React.Fragment>
    )
  }
}

export default Dapplets
