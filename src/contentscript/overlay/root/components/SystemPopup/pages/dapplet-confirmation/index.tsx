import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import browser from 'webextension-polyfill'
import ModuleInfo from '../../../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../../../background/models/versionInfo'
import { Bus } from '../../../../../../../common/bus'
import { parseModuleName } from '../../../../../../../common/helpers'
import { DappletCard } from '../../components/DappletCard'

interface Props {
  data: {
    sourceExtensionVersion: string
    moduleId: string
    contextIds: string[]
    registry: string
    payload: any
  }
  bus: Bus
}

interface State {
  isLoading: boolean
  mi: ModuleInfo
  vi: VersionInfo
  swarmGatewayUrl: string
  isDetailsVisible: boolean
  trustedUsers: { account: string }[]
  registries: {
    isEnabled: boolean
    url: string
    isDev: boolean
    isAvailable: boolean
    error: string
  }[]
  activeModule: {
    name: string
    branch: string
    version: string
    order: number
    hostnames: string[]
  } | null
  isRegistryExists: boolean
  isRegistryEnabled: boolean
  isTrustedUserExists: boolean
  isTrustedUserEnabled: boolean
  isModuleActivated: boolean
  isModuleVersionEqual: boolean
  isAllOk: boolean
}

export class DappletConfirmation extends React.Component<Props, State> {
  private _isMounted = false

  constructor(props: Props) {
    super(props)
    this.state = {
      isLoading: true,
      mi: null,
      vi: null,
      swarmGatewayUrl: '',
      isDetailsVisible: false,
      trustedUsers: [],
      registries: [],
      activeModule: null,
      isRegistryExists: true,
      isRegistryEnabled: true,
      isTrustedUserExists: true,
      isTrustedUserEnabled: true,
      isModuleActivated: true,
      isModuleVersionEqual: true,
      isAllOk: true,
    }
  }

  async componentDidMount() {
    this._isMounted = true

    const p = this.props
    const { moduleId, registry, contextIds } = this.props.data
    const {
      getVersionInfo,
      getModuleInfoByName,
      getSwarmGateway,
      getTrustedUsers,
      getRegistries,
      getActiveModulesByHostnames,
    } = await initBGFunctions(browser)
    const module = parseModuleName(moduleId)
    const vi = await getVersionInfo(registry, module.name, module.branch, module.version)
    const mi = await getModuleInfoByName(registry, module.name)
    const swarmGatewayUrl = await getSwarmGateway()
    const trustedUsers = await getTrustedUsers()
    const registries = await getRegistries()
    const activeModules = await getActiveModulesByHostnames(contextIds)

    const targetRegistry = registries.find((x) => x.url === p.data.registry)
    const targetTrustedUser = trustedUsers.find(
      (x) => x.account.toLowerCase() === mi?.author?.toLowerCase()
    )
    const targetModuleId = parseModuleName(p.data.moduleId)
    const activeModule = activeModules.find(
      (x) => x.name === targetModuleId.name && x.branch === targetModuleId.branch
    )

    const isRegistryExists = !!targetRegistry
    const isRegistryEnabled = isRegistryExists && targetRegistry.isEnabled
    const isRegistryDev = isRegistryExists && targetRegistry.isDev
    const isTrustedUserExists = !!targetTrustedUser || isRegistryDev
    const isTrustedUserEnabled = true || isRegistryDev // ToDo: use targetTrustedUser.isEnabled when Trusted User (de)activation feature will be done.
    const isModuleActivated = !!activeModule
    const isModuleVersionEqual =
      isModuleActivated && activeModule.version === targetModuleId.version
    const isAllOk =
      isRegistryExists &&
      isRegistryEnabled &&
      isTrustedUserExists &&
      isTrustedUserEnabled &&
      isModuleActivated &&
      isModuleVersionEqual

    if (this._isMounted) {
      this.setState({
        isLoading: false,
        mi,
        vi,
        swarmGatewayUrl,
        trustedUsers,
        registries,
        activeModule,
        isRegistryExists,
        isRegistryEnabled,
        isTrustedUserExists,
        isTrustedUserEnabled,
        isModuleActivated,
        isModuleVersionEqual,
        isAllOk,
      })
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  async confirmButtonClickHandler() {
    this.setState({ isLoading: true })

    const s = this.state,
      p = this.props
    const { addTrustedUser, activateFeature, reloadFeature, reloadCurrentPage } =
      await initBGFunctions(browser)

    // ToDo: move it to the background?

    if (!s.isTrustedUserExists) {
      await addTrustedUser(s.mi.author)
      await reloadCurrentPage()
    }

    // ToDo: enable trusted user
    // if (!s.isTrustedUserEnabled) { }

    if (!s.isModuleActivated) {
      await activateFeature(s.mi.name, s.vi.version, p.data.contextIds, 0, p.data.registry)
    }

    if (s.isModuleActivated && !s.isModuleVersionEqual) {
      await reloadFeature(s.mi.name, s.vi.version, p.data.contextIds, 0, p.data.registry)
    }

    // this.setState({ isLoading: false });
    p.bus.publish('ready')
  }

  async addRegistryClickHandler() {
    const p = this.props
    this.setState({ isLoading: true })
    const { addRegistry, enableRegistry, reloadCurrentPage } = await initBGFunctions(browser)
    await addRegistry(p.data.registry, false)
    await enableRegistry(p.data.registry)
    await reloadCurrentPage()
    await this.componentDidMount()
  }

  async enableRegistryClickHandler() {
    const p = this.props
    this.setState({ isLoading: true })
    const { enableRegistry, reloadCurrentPage } = await initBGFunctions(browser)
    await enableRegistry(p.data.registry)
    await reloadCurrentPage()
    await this.componentDidMount()
  }

  cancelButtonClickHandler() {
    this.props.bus.publish('cancel')
  }

  render() {
    const p = this.props,
      s = this.state

    if (s.isLoading) {
      return <div>Loading</div>
    }

    if (!s.isRegistryExists) {
      return (
        <React.Fragment>
          <h1>Add new registry</h1>
          <p>You are opening the share link which requires the changes.</p>
          <p>
            Add and enable the registry <b>{p.data.registry}</b>?
          </p>
          <p>The current webpage will be reloaded.</p>

          {/* ToDo: Here was semantic ui <Button primary> */}
          <button onClick={this.addRegistryClickHandler.bind(this)}>OK</button>
          {/* ToDo: Here was semantic ui <Button> */}
          <button onClick={this.cancelButtonClickHandler.bind(this)}>Cancel</button>
        </React.Fragment>
      )
    }

    if (!s.isRegistryEnabled) {
      return (
        <React.Fragment>
          <h1>Enable registry</h1>
          <p>You are opening the share link which requires the changes.</p>
          <p>
            Enable the registry <b>{p.data.registry}</b>?
          </p>
          <p>The current webpage will be reloaded.</p>

          {/* ToDo: Here was semantic ui <Button primary> */}
          <button onClick={this.enableRegistryClickHandler.bind(this)}>OK</button>
          {/* ToDo: Here was semantic ui <Button> */}
          <button onClick={this.cancelButtonClickHandler.bind(this)}>Cancel</button>
        </React.Fragment>
      )
    }

    if (!s.vi || !s.mi) {
      return (
        <React.Fragment>
          <h1>No Dapplet</h1>

          <p>
            The dapplet <b>{p.data.moduleId}</b> is not found in the registry{' '}
            <b>{p.data.registry}</b>.
          </p>

          {/* ToDo: Here was semantic ui <Button> */}
          <button onClick={this.cancelButtonClickHandler.bind(this)}>OK</button>
        </React.Fragment>
      )
    }

    return (
      <React.Fragment>
        <h1>Changes Required</h1>

        <p>You are opening the share link which requires the changes.</p>
        <p>Do you want to apply them and continue?</p>

        <DappletCard vi={s.vi} mi={s.mi} swarmGatewayUrl={s.swarmGatewayUrl} />

        {!s.isAllOk ? (
          <div>
            <p>The following changes will be applied:</p>
            <ul>
              {!s.isRegistryExists ? (
                <li>
                  add the registry <b>{p.data.registry}</b>
                </li>
              ) : null}
              {!s.isRegistryEnabled ? (
                <li>
                  enable the registry <b>{p.data.registry}</b>
                </li>
              ) : null}
              {!s.isTrustedUserExists ? (
                <li>
                  add the trusted user <b>{s.mi?.author}</b>
                </li>
              ) : null}
              {!s.isTrustedUserEnabled ? (
                <li>
                  enable the truster user <b>{s.mi?.author}</b>
                </li>
              ) : null}
              {!s.isModuleActivated ? (
                <li>
                  activate the dapplet <b>{p.data.moduleId}</b> on the contexts:{' '}
                  <b>{p.data.contextIds.join(', ')}</b>
                </li>
              ) : null}
              {!s.isModuleVersionEqual && s.activeModule ? (
                <li>
                  change the dapplet version from <b>{s.activeModule?.version}</b> to{' '}
                  <b>{s.vi.version}</b>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {!s.isTrustedUserExists ? <p>The current webpage will be reloaded.</p> : null}

        {/* ToDo: here was Accordion */}
        {/* <Accordion style={{ marginBottom: '14px' }}>
          <Accordion.Title
            active={s.isDetailsVisible}
            onClick={() => this.setState({ isDetailsVisible: !s.isDetailsVisible })}
          >
            <Icon name="dropdown" />
            Payload Details
          </Accordion.Title>
          <Accordion.Content active={s.isDetailsVisible}>
            <p>The following data is encoded in the share link and will be sent to the dapplet.</p>
            <pre style={{ marginTop: '0', padding: '14px', backgroundColor: '#f7f7f7' }}>
              <code>{JSON.stringify(p.data.payload, null, 2)}</code>
            </pre>
          </Accordion.Content>
        </Accordion> */}

        <div style={{ marginBottom: '14px' }}>
          <div
            // active={s.isDetailsVisible}
            onClick={() => this.setState({ isDetailsVisible: !s.isDetailsVisible })}
          >
            {/* <Icon name="dropdown" /> */}
            Payload Details
          </div>
          <div
          //active={s.isDetailsVisible}
          >
            <p>The following data is encoded in the share link and will be sent to the dapplet.</p>
            <pre style={{ marginTop: '0', padding: '14px', backgroundColor: '#f7f7f7' }}>
              <code>{JSON.stringify(p.data.payload, null, 2)}</code>
            </pre>
          </div>
        </div>

        {/* ToDo: Here was semantic ui <Button primary> */}
        <button onClick={this.confirmButtonClickHandler.bind(this)}>OK</button>
        {/* ToDo: Here was semantic ui <Button> */}
        <button onClick={this.cancelButtonClickHandler.bind(this)}>Cancel</button>
      </React.Fragment>
    )
  }
}
