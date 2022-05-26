import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button, Card, Form, Icon, Input, List, Message, Modal, Popup } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../background/models/moduleInfo'
import VersionInfo from '../background/models/versionInfo'
import { Bus } from '../common/bus'
import { DEFAULT_BRANCH_NAME, ModuleTypes, StorageTypes } from '../common/constants'
import { chainByUri, typeOfUri } from '../common/helpers'
import '../common/semantic-ui-css/semantic.min.css'
import * as tracing from '../common/tracing'
import { ChainTypes, DefaultSigners } from '../common/types'
import { StorageRefImage } from '../popup/components/StorageRefImage'
import { EditableList } from './EditableList'
import './index.scss'

tracing.startTracing()

enum DeploymentStatus {
  Unknown,
  Deployed,
  NotDeployed,
  NewModule,
}

enum DependencyType {
  Dependency,
  Interface,
}

enum FormMode {
  Deploying,
  Creating,
  Editing,
}

type DependencyChecking = {
  name: string
  version: string
  type: DependencyType
  isExists?: boolean
}

interface IIndexProps {}

interface IIndexState {
  originalMi: ModuleInfo
  mi: ModuleInfo
  vi: VersionInfo | null
  dependenciesChecking: DependencyChecking[]
  loading: boolean
  targetRegistry: string
  targetChain: ChainTypes
  targetStorages: string[]
  message: {
    type: 'negative' | 'positive'
    header: string
    message: string[]
  }
  registryOptions: { key: string; value: string; text: string }[]
  owner: string
  currentAccount: string
  newOwner: string
  newOwnerLoading: boolean
  newOwnerDone: boolean
  editContextId: string
  editContextIdLoading: boolean
  editContextIdDone: boolean
  deploymentStatus: DeploymentStatus
  trustedUsers: { account: string }[]
  swarmGatewayUrl: string
  mode: FormMode
  isSaving: boolean
}

class Index extends React.Component<IIndexProps, IIndexState> {
  private bus = new Bus()
  private transferOwnershipModal = React.createRef<any>()
  private addContextIdModal = React.createRef<any>()
  private fileInputRef = React.createRef<HTMLInputElement>()

  constructor(props) {
    super(props)

    this.state = {
      originalMi: null,
      mi: null,
      vi: null,
      dependenciesChecking: [],
      loading: true,
      targetRegistry: null,
      targetChain: null,
      targetStorages: [StorageTypes.Swarm, StorageTypes.Sia, StorageTypes.Ipfs],
      message: null,
      registryOptions: [],
      owner: null,
      currentAccount: null,
      newOwner: '',
      newOwnerLoading: false,
      newOwnerDone: false,
      editContextId: '',
      editContextIdLoading: false,
      editContextIdDone: false,
      deploymentStatus: DeploymentStatus.Unknown,
      trustedUsers: [],
      swarmGatewayUrl: '',
      mode: null,
      isSaving: false,
    }

    this.bus.subscribe('data', async ({ mi, vi }: { mi: ModuleInfo; vi: VersionInfo }) => {
      const { getSwarmGateway } = await initBGFunctions(browser)
      const swarmGatewayUrl = await getSwarmGateway()

      if (mi === null && vi === null) {
        // New module
        const mi = new ModuleInfo()

        this.setState({
          originalMi: JSON.parse(JSON.stringify(mi)),
          mi,
          loading: false,
          swarmGatewayUrl,
          mode: FormMode.Creating,
        })
        await this._updateData()
      } else {
        // Deploy module
        const dependencies = vi?.dependencies
          ? Object.entries(vi.dependencies).map(([name, version]) => ({
              name: name,
              version: version,
              type: DependencyType.Dependency,
            }))
          : []
        const interfaces = vi?.interfaces
          ? Object.entries(vi.interfaces).map(([name, version]) => ({
              name: name,
              version: version,
              type: DependencyType.Interface,
            }))
          : []
        const dependenciesChecking = [...dependencies, ...interfaces]
        this.setState({
          originalMi: JSON.parse(JSON.stringify(mi)),
          mi,
          vi,
          dependenciesChecking,
          loading: false,
          swarmGatewayUrl,
          targetStorages:
            Object.keys(vi?.overlays ?? {}).length > 0
              ? [StorageTypes.Swarm, StorageTypes.Sia]
              : [StorageTypes.Swarm, StorageTypes.Sia, StorageTypes.Ipfs],
          mode: FormMode.Deploying,
        })
        await this._updateData()
      }
    })
  }

  private async _checkDependencies() {
    const { getVersionInfo } = await initBGFunctions(browser)
    const { dependenciesChecking: deps, targetRegistry } = this.state
    await Promise.all(
      deps.map((x) =>
        getVersionInfo(targetRegistry, x.name, DEFAULT_BRANCH_NAME, x.version).then(
          (y) => (x.isExists = !!y)
        )
      )
    )
  }

  private async _updateData() {
    const { getRegistries, getTrustedUsers } = await initBGFunctions(browser)

    const registries = await getRegistries()
    const trustedUsers = await getTrustedUsers()
    const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)
    this.setState({
      registryOptions: prodRegistries.map((r) => ({
        key: r.url,
        text: r.url,
        value: r.url,
      })),
      targetRegistry: prodRegistries[0]?.url || null,
      trustedUsers,
      targetChain: chainByUri(typeOfUri(prodRegistries[0]?.url ?? '')),
    })

    if (this.state.mode === FormMode.Creating) {
      return Promise.all([this._updateCurrentAccount()])
    } else {
      return Promise.all([
        this._updateOwnership(),
        this._updateCurrentAccount(),
        this._updateDeploymentStatus(),
        this._checkDependencies(),
      ])
    }
  }

  private async _updateCurrentAccount() {
    const { getOwnership, getAddress } = await initBGFunctions(browser)
    const currentAccount = await getAddress(DefaultSigners.EXTENSION, this.state.targetChain)
    this.setState({ currentAccount })
  }

  private async _updateOwnership() {
    const { getOwnership } = await initBGFunctions(browser)
    const owner = await getOwnership(this.state.targetRegistry, this.state.mi.name)
    this.setState({ owner })
  }

  private async _updateDeploymentStatus() {
    const s = this.state
    this.setState({ deploymentStatus: DeploymentStatus.Unknown })
    const { getVersionInfo, getModuleInfoByName } = await initBGFunctions(browser)
    const mi = await getModuleInfoByName(s.targetRegistry, s.mi.name)
    const deployed = s.vi
      ? await getVersionInfo(s.targetRegistry, s.mi.name, s.vi.branch, s.vi.version)
      : true
    const deploymentStatus = !mi
      ? DeploymentStatus.NewModule
      : deployed
      ? DeploymentStatus.Deployed
      : DeploymentStatus.NotDeployed
    this.setState({ deploymentStatus })
  }

  private async _transferOwnership(newAccount: string) {
    this.setState({ newOwnerLoading: true })
    const oldAccount = this.state.mi.author
    const { transferOwnership } = await initBGFunctions(browser)
    await transferOwnership(this.state.targetRegistry, this.state.mi.name, newAccount, oldAccount)
    this.setState({ newOwnerLoading: false, newOwnerDone: true })
  }

  private async _addContextId(contextId: string) {
    this.setState({ editContextIdLoading: true })
    const { addContextId } = await initBGFunctions(browser)
    await addContextId(this.state.targetRegistry, this.state.mi.name, contextId)
    this.setState({ editContextIdLoading: false, editContextIdDone: true })
  }

  private async _removeContextId(contextId: string) {
    this.setState({ editContextIdLoading: true })
    const { removeContextId } = await initBGFunctions(browser)
    await removeContextId(this.state.targetRegistry, this.state.mi.name, contextId)
    this.setState({ editContextIdLoading: false, editContextIdDone: true })
  }

  async deployButtonClickHandler() {
    this.setState({ loading: true })

    const { deployModule, addTrustedUser } = await initBGFunctions(browser)
    const { mi, vi, targetRegistry, targetStorages, currentAccount, mode } = this.state

    try {
      const isNotNullCurrentAccount = !(
        !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
      )
      const isNotTrustedUser =
        isNotNullCurrentAccount &&
        !this.state.trustedUsers.find(
          (x) => x.account.toLowerCase() === currentAccount.toLowerCase()
        )
      if (isNotTrustedUser) {
        await addTrustedUser(currentAccount.toLowerCase())
      }

      const result =
        mode === FormMode.Creating
          ? await deployModule(mi, null, targetStorages, targetRegistry)
          : await deployModule(mi, vi, targetStorages, targetRegistry)

      this.setState({
        message: {
          type: 'positive',
          header: 'Module was deployed',
          message: [`Script URL: ${result.scriptUrl}`],
        },
        deploymentStatus: DeploymentStatus.Deployed,
      })
    } catch (err) {
      this.setState({
        message: {
          type: 'negative',
          header: 'Publication error',
          message: [err.message],
        },
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  async reuploadButtonClickHandler() {
    this.setState({ loading: true })

    const { uploadModule } = await initBGFunctions(browser)
    const { mi, vi, targetStorages } = this.state

    try {
      const scriptUrl = await uploadModule(mi, vi, targetStorages)
      this.setState({
        message: {
          type: 'positive',
          header: 'Module was reuploaded',
          message: [`Script URL: ${scriptUrl}`],
        },
        deploymentStatus: DeploymentStatus.Deployed,
      })
    } catch (err) {
      this.setState({
        message: {
          type: 'negative',
          header: 'Publication error',
          message: [err.message],
        },
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  async pairWallet() {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    await pairWalletViaOverlay(this.state.targetChain, DefaultSigners.EXTENSION, null)
    await this._updateData()
  }

  changeTargetStorage(storage: StorageTypes, checked: boolean) {
    let { targetStorages } = this.state
    targetStorages = targetStorages.filter((x) => x !== storage)
    if (checked) targetStorages.push(storage)
    this.setState({ targetStorages })
  }

  async iconInputChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
    const s = this.state
    const files = event.target.files
    if (files.length > 0) {
      const file = files[0]
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
      })
      s.mi.icon = {
        hash: null,
        uris: [base64],
      }
    } else {
      s.mi.icon = null
    }
    this.setState({ mi: s.mi })
  }

  async saveChanges() {
    try {
      this.setState({ isSaving: true })
      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(this.state.targetRegistry, this.state.targetStorages, this.state.mi)
      this.setState({
        isSaving: false,
        originalMi: JSON.parse(JSON.stringify(this.state.mi)),
      })
    } catch (err) {
      this.setState({
        message: {
          type: 'negative',
          header: 'Publication error',
          message: [err.message],
        },
      })
    } finally {
      this.setState({ isSaving: false })
    }
  }

  render() {
    const s = this.state
    const {
      mi,
      vi,
      loading,
      targetRegistry,
      targetStorages,
      message,
      dependenciesChecking,
      owner,
      currentAccount,
      newOwner,
      editContextId,
      newOwnerLoading,
      newOwnerDone,
      editContextIdLoading,
      editContextIdDone,
      mode,
    } = this.state

    const isNoStorage = targetStorages.length === 0
    const isNotNullCurrentAccount = !(
      !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
    )
    const isNotWalletPaired = !isNotNullCurrentAccount && !!owner
    const isNotAnOwner =
      !!owner && isNotNullCurrentAccount && owner.toLowerCase() !== currentAccount.toLowerCase()
    const isAlreadyDeployed = !message && s.deploymentStatus === DeploymentStatus.Deployed
    const isNewModule = s.deploymentStatus === DeploymentStatus.NewModule
    const isNotTrustedUser =
      isNotNullCurrentAccount &&
      !s.trustedUsers.find((x) => x.account.toLowerCase() === currentAccount.toLowerCase())
    const isDependenciesExist =
      dependenciesChecking.length > 0
        ? dependenciesChecking.every((x) => x.isExists === true)
        : true
    const isDependenciesLoading =
      dependenciesChecking.length > 0
        ? dependenciesChecking.every((x) => x.isExists === undefined)
        : false
    const isManifestValid = mi?.name && mi?.title && mi?.type
    const isDeployButtonDisabled =
      loading ||
      s.deploymentStatus === DeploymentStatus.Deployed ||
      !isNotNullCurrentAccount ||
      isNotAnOwner ||
      isNoStorage ||
      isDependenciesLoading ||
      !isDependenciesExist ||
      !isManifestValid
    const isReuploadButtonDisabled = !isAlreadyDeployed || mode === FormMode.Creating || !vi

    return (
      <React.Fragment>
        <h2>Module Deployment</h2>

        {message ? (
          <Message positive={message.type === 'positive'} negative={message.type === 'negative'}>
            <Message.Header>{message.header}</Message.Header>
            {message.message.map((m, i) => (
              <p key={i} style={{ overflowWrap: 'break-word' }}>
                {m}
              </p>
            ))}
          </Message>
        ) : null}

        {!isNotNullCurrentAccount ? (
          owner ? (
            <Message
              warning
              header="The wrong wallet"
              content={
                <React.Fragment>
                  Change account to {owner}
                  <br />
                  Connect a new wallet <Icon name="chain" link onClick={() => this.pairWallet()} />
                </React.Fragment>
              }
            />
          ) : (
            <Message
              warning
              header="Wallet is not connected"
              content={
                <React.Fragment>
                  You can not deploy a module without a wallet.
                  <br />
                  Connect a new wallet <Icon name="chain" link onClick={() => this.pairWallet()} />
                </React.Fragment>
              }
            />
          )
        ) : null}

        {isNotAnOwner ? (
          <Message
            error
            header="Action Forbidden"
            content={
              <React.Fragment>
                You can not deploy this module to the selected registry, because are not the
                module's owner.
                <br />
                Change account to {owner}
              </React.Fragment>
            }
          />
        ) : null}

        {isAlreadyDeployed && vi ? (
          <Message
            warning
            header="The Module Already Deployed"
            content={
              <React.Fragment>
                This version of the module has already been deployed to the selected registry. You
                can choose another registry or increment the module version number.
              </React.Fragment>
            }
          />
        ) : null}

        {!isDependenciesLoading && !isDependenciesExist ? (
          <Message
            warning
            header="Missing Dependencies"
            content={
              <>
                The following modules are not published in the selected registry:
                <br />
                <List as="ul" style={{ marginTop: '4px' }}>
                  {dependenciesChecking
                    .filter((x) => x.isExists === false)
                    .map((x, i) => (
                      <List.Item key={i} as="li">
                        {x.name}#default@{x.version}
                      </List.Item>
                    ))}
                </List>
              </>
            }
          />
        ) : null}

        {isNewModule ? (
          <Message
            info
            header="New Module"
            content={
              <>
                This module will be published for the first time in the selected registry.
                {s.mi.contextIds && s.mi.contextIds.length > 0 ? (
                  <>
                    <br />
                    The following Context IDs will be added by default:
                    <List as="ul" style={{ marginTop: '4px' }}>
                      {s.mi.contextIds.map((x, i) => (
                        <List.Item key={i} as="li">
                          {x}
                        </List.Item>
                      ))}
                    </List>
                  </>
                ) : null}
              </>
            }
          />
        ) : null}

        {isNotTrustedUser && s.deploymentStatus !== DeploymentStatus.Deployed ? (
          <Message
            info
            header="Untrusted User"
            content={
              <>
                Your account is not on the list of trusted users.
                <br />
                It will be added automatically when the module is deployed.
              </>
            }
          />
        ) : null}

        {mi && s.mode === FormMode.Deploying ? (
          <Card fluid>
            <Card.Content>
              <StorageRefImage
                storageRef={mi.icon}
                className="ui mini circular right floated image"
              />
              <Card.Header>{mi.title}</Card.Header>
              <Card.Meta>{mi.type}</Card.Meta>
              <Card.Description>
                {mi.description}
                <br />
                {mi.author}
                <br />
                {vi ? (
                  <strong>
                    {mi.name}#{vi.branch}@{vi.version}
                  </strong>
                ) : (
                  <strong>{mi.name}</strong>
                )}
                <br />
                {owner ? (
                  <>
                    Owner:{' '}
                    <a
                      href="#"
                      onClick={() =>
                        window.open(`https://goerli.etherscan.io/address/${owner}`, '_blank')
                      }
                    >
                      {owner}
                    </a>
                  </>
                ) : null}
              </Card.Description>
            </Card.Content>

            {owner && owner?.toLowerCase() === currentAccount?.toLowerCase() ? (
              <Card.Content extra>
                <div className="ui three buttons">
                  <Modal
                    closeOnEscape={false}
                    closeOnDimmerClick={false}
                    ref={this.transferOwnershipModal}
                    dimmer="inverted"
                    trigger={
                      <Button basic color="grey">
                        Transfer ownership
                      </Button>
                    }
                    centered={false}
                  >
                    <Modal.Header>Ownership Transfering</Modal.Header>
                    <Modal.Content image>
                      <Modal.Description>
                        <Message warning>
                          <Message.Header>IMPORTANT</Message.Header>
                          Make sure the address is correct, otherwise you will lose control over the
                          module.
                        </Message>
                        <Input
                          fluid
                          placeholder="New owner address..."
                          value={newOwner}
                          onChange={(e, data) => this.setState({ newOwner: data.value as string })}
                        />
                      </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                      <Button
                        basic
                        onClick={() => {
                          this.setState({ newOwner: '', newOwnerDone: false })
                          this.transferOwnershipModal.current.handleClose()
                          this._updateData()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        color="blue"
                        loading={newOwnerLoading}
                        disabled={newOwnerLoading || newOwnerDone || !newOwner}
                        onClick={() => this._transferOwnership(s.newOwner)}
                      >
                        {!newOwnerDone ? 'Transfer' : 'Done'}
                      </Button>
                    </Modal.Actions>
                  </Modal>

                  <Modal
                    closeOnEscape={false}
                    closeOnDimmerClick={false}
                    ref={this.addContextIdModal}
                    dimmer="inverted"
                    trigger={
                      <Button basic color="grey">
                        Context IDs
                      </Button>
                    }
                    centered={false}
                  >
                    <Modal.Header>Manage Context IDs</Modal.Header>
                    <Modal.Content image>
                      <Modal.Description>
                        <p>
                          Here you can (un)bind the module to make it (un)accessible in modules list
                          of website context.
                        </p>
                        <Input
                          fluid
                          placeholder="Context ID (ex: example.com)"
                          value={editContextId}
                          onChange={(e, data) =>
                            this.setState({
                              editContextId: data.value as string,
                            })
                          }
                        />
                      </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                      <Button
                        basic
                        onClick={() => {
                          this.setState({
                            editContextId: '',
                            editContextIdDone: false,
                          })
                          this.addContextIdModal.current.handleClose()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        color="blue"
                        loading={editContextIdLoading}
                        disabled={editContextIdLoading || editContextIdDone || !editContextId}
                        onClick={() => this._addContextId(s.editContextId)}
                      >
                        {!editContextIdDone ? 'Add' : 'Done'}
                      </Button>
                      <Button
                        color="blue"
                        loading={editContextIdLoading}
                        disabled={editContextIdLoading || editContextIdDone || !editContextId}
                        onClick={() => this._removeContextId(s.editContextId)}
                      >
                        {!editContextIdDone ? 'Remove' : 'Done'}
                      </Button>
                    </Modal.Actions>
                  </Modal>

                  <Button
                    basic
                    color="grey"
                    onClick={() => this.setState({ mode: FormMode.Editing })}
                  >
                    Edit Module Info
                  </Button>
                </div>
              </Card.Content>
            ) : null}
          </Card>
        ) : null}

        <Form loading={loading} style={{ marginBottom: '20px' }}>
          {s.mode === FormMode.Creating || s.mode === FormMode.Editing ? (
            <>
              <Form.Input
                required
                label="Module Name"
                readOnly={mode === FormMode.Editing}
                placeholder="Module ID like module_name.dapplet-base.eth"
                value={s.mi.name ?? ''}
                onChange={(_, data) => {
                  s.mi.name = data.value
                  if (s.vi) s.vi.name = data.value
                  this.setState({ mi: s.mi, vi: s.vi })
                }}
              />

              <Form.Input
                required
                label="Title"
                placeholder="A short name of your module"
                value={s.mi.title ?? ''}
                onChange={(_, data) => ((s.mi.title = data.value), this.setState({ mi: s.mi }))}
              />

              <Form.Input
                required
                label="Description"
                placeholder="A small description of what your module does"
                value={s.mi.description ?? ''}
                onChange={(_, data) => (
                  (s.mi.description = data.value), this.setState({ mi: s.mi })
                )}
              />

              <Form.Field label="Icon" />
              <div style={{ marginBottom: '1em' }}>
                <input
                  ref={this.fileInputRef}
                  type="file"
                  accept=".png"
                  onChange={this.iconInputChangeHandler.bind(this)}
                />
              </div>

              {mode === FormMode.Creating ? (
                <>
                  <Form.Field label="Module Type" required />
                  <Form.Radio
                    label="Library"
                    value={ModuleTypes.Library}
                    checked={mi.type === ModuleTypes.Library}
                    onChange={(_, data) =>
                      data.checked && ((mi.type = ModuleTypes.Library), this.setState({ mi }))
                    }
                  />
                  <Form.Radio
                    label="Dapplet"
                    value={ModuleTypes.Feature}
                    checked={mi.type === ModuleTypes.Feature}
                    onChange={(_, data) =>
                      data.checked && ((mi.type = ModuleTypes.Feature), this.setState({ mi }))
                    }
                  />
                  <Form.Radio
                    label="Adapter"
                    value={ModuleTypes.Adapter}
                    checked={mi.type === ModuleTypes.Adapter}
                    onChange={(_, data) =>
                      data.checked && ((mi.type = ModuleTypes.Adapter), this.setState({ mi }))
                    }
                  />
                  <Form.Radio
                    label="Interface"
                    value={ModuleTypes.Interface}
                    checked={mi.type === ModuleTypes.Interface}
                    onChange={(_, data) =>
                      data.checked && ((mi.type = ModuleTypes.Interface), this.setState({ mi }))
                    }
                  />

                  <Form.Field label="Context IDs" />
                  <EditableList
                    style={{ marginBottom: '1em' }}
                    items={this.state.mi.contextIds}
                    onChange={(x) => {
                      this.state.mi.contextIds = x
                      this.setState({ mi: this.state.mi })
                    }}
                  />
                </>
              ) : null}
            </>
          ) : null}

          <Form.Input required label="Target Registry" value={targetRegistry ?? ''} readOnly />

          <Form.Field label="Target Storages" required />

          <Form.Checkbox
            label={
              <label>
                Centralized{' '}
                <Popup
                  trigger={<Icon name="info circle" />}
                  content="The centralized storage maintained by Dapplets Project. It backs up your modules in case decentralized storages become unavailable."
                  size="small"
                />
              </label>
            }
            checked={true}
            // checked={targetStorages.includes(StorageTypes.Centralized)}
            // onChange={(_, d) => this.changeTargetStorage(StorageTypes.Centralized, d.checked)}
            readOnly
          />

          <Form.Checkbox
            label="Swarm"
            checked={targetStorages.includes(StorageTypes.Swarm)}
            onChange={(_, d) => this.changeTargetStorage(StorageTypes.Swarm, d.checked)}
          />

          <Form.Checkbox
            label="SIA"
            checked={targetStorages.includes(StorageTypes.Sia)}
            onChange={(_, d) => this.changeTargetStorage(StorageTypes.Sia, d.checked)}
          />

          <Form.Checkbox
            label={
              <label>
                IPFS{' '}
                <Popup
                  trigger={<Icon name="warning sign" />}
                  content="This is an experimental feature. Uploaded modules must be manually pinned by you to keep them available. Uploading overlays is not yet implemented."
                  size="small"
                />
              </label>
            }
            checked={targetStorages.includes(StorageTypes.Ipfs)}
            onChange={(_, d) => this.changeTargetStorage(StorageTypes.Ipfs, d.checked)}
            style={{ marginBottom: '25px' }}
          />

          {mode !== FormMode.Editing ? (
            <>
              <Button
                primary
                disabled={isDeployButtonDisabled}
                onClick={() => this.deployButtonClickHandler()}
              >
                Deploy
              </Button>
              <Button
                disabled={isReuploadButtonDisabled}
                onClick={() => this.reuploadButtonClickHandler()}
              >
                Reupload
              </Button>
            </>
          ) : (
            <>
              <Button
                primary
                disabled={!s.mi?.title || !s.mi?.description || s.isSaving}
                loading={s.isSaving}
                onClick={() => this.saveChanges()}
              >
                Save
              </Button>
              <Button
                disabled={s.isSaving}
                onClick={() =>
                  this.setState(({ originalMi }) => ({
                    mode: FormMode.Deploying,
                    mi: originalMi,
                  }))
                }
              >
                Cancel
              </Button>
            </>
          )}
        </Form>
      </React.Fragment>
    )
  }
}

ReactDOM.render(<Index />, document.querySelector('#app'))
