import React, {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  FC,
  useRef,
} from 'react'
import cn from 'classnames'
import styles from './UnderConstructionInfo.module.scss'
import { SettingWrapper } from '../../components/SettingWrapper'
import { SettingItem } from '../../components/SettingItem'
import {
  isValidHttp,
  isValidUrl,
  isValidPostageStampId,
} from '../../../../../popup/helpers'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'
import { Bus } from '../../../../../common/bus'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import * as tracing from '../../../../../common/tracing'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { typeOfUri, chainByUri, joinUrls } from '../../../../../common/helpers'
import { StorageRefImage } from '../../components/DevModulesList'
import {
  DEFAULT_BRANCH_NAME,
  ModuleTypes,
  StorageTypes,
} from '../../../../../common/constants'
import { Icon, List, Message } from 'semantic-ui-react'
// const iconInputChangeHandler = async (
//   event: React.ChangeEvent<HTMLInputElement>
// ) => {
//   // const s = this.state
//   const files = event.target.files
//   if (files.length > 0) {
//     const file = files[0]
//     const base64: string = await new Promise((resolve, reject) => {
//       const reader = new FileReader()
//       reader.readAsDataURL(file)
//       reader.onload = () => resolve(reader.result as string)
//       reader.onerror = (error) => reject(error)
//     })
//     mi.icon = {
//       hash: null,
//       uris: [base64],
//     }
//   } else {
//     mi.icon = null
//   }
//   // setMi(mi)
//   // console.log(mi)
// }
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

export interface UnderConstructionInfoProps {
  // isDappletsDetails: boolean
  // setDappletsDetail: (x) => void
  ModuleInfo: any
  ModuleVersion: any
  setUnderConstructionDetails: (x) => void
}

let _isMounted = false

export const UnderConstructionInfo: FC<UnderConstructionInfoProps> = (
  props
) => {
  const { setUnderConstructionDetails, ModuleInfo, ModuleVersion } = props

  const bus = new Bus()
  const transferOwnershipModal = React.createRef<any>()
  const addContextIdModal = React.createRef<any>()
  const fileInputRef = React.createRef<HTMLInputElement>()
  const [originalMi, setOriginalMi] = useState(null)
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [vi, setVi] = useState<VersionInfo>(ModuleVersion)
  const [dependenciesChecking, setDpendenciesChecking] =
    useState<DependencyChecking[]>()
  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [message, setMessage] = useState(null)
  const [registryOptions, setRegistryOptions] = useState([])
  const [owner, setOwner] = useState(null)
  const [currentAccount, setCurrentAccount] = useState(null)
  const [newOwner, setNewOwner] = useState('')
  const [newOwnerLoading, setNewOwnerLoading] = useState(false)
  const [newOwnerDone, setNewOwnerDone] = useState(false)
  const [editContextId, setEditContextId] = useState('')
  const [editContextIdLoading, setEditContextIdLoading] = useState(false)
  const [editContextIdDone, setEditContextIdDone] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState(
    DeploymentStatus.Unknown
  )
  const [trustedUsers, setTrustedUsers] = useState([])
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  const [mode, setMode] = useState(null)
  const [sawing, isSawing] = useState(false)
  const [targetStorages, setTargetStorages] = useState([
    StorageTypes.Swarm,
    StorageTypes.Sia,
    StorageTypes.Ipfs,
  ])

  const [author, setAuthor] = useState({ authorForm: [] })

  const newAuthorObject = {
    author: 'New admins',
  }

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await _updateData()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [mi])
  const addButtonClickHandler = () => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.push(newAuthorObject)
    setAuthor(newAuthor)
    console.log(author)
  }

  const onDeleteChild = (id: number) => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.splice(id, 1)
    setAuthor(newAuthor)
    console.log(author)
  }

  // const [contextId, setContextId] = useState(mi)
  const newContextObject = ''
  const addButtonClickHandlerContext = () => {
    const newContext = Object.assign({}, mi)
    newContext.contextIds.push(
      // ...mi.contextIds,
      newContextObject
    )
    setMi(newContext)
    console.log(mi)
  }

  const onDeleteChildContext = (id: number) => {
    const newContext = Object.assign({}, mi)
    newContext.contextIds.splice(id, 1)
    setMi(newContext)
    console.log(mi)
    console.log(id)
  }

  // ===
  bus.subscribe(
    'data',
    async ({ mi, vi }: { mi: ModuleInfo; vi: VersionInfo }) => {
      const { getSwarmGateway } = await initBGFunctions(browser)
      const swarmGatewayUrl = await getSwarmGateway()

      if (mi === null && vi === null) {
        // New module
        const mi = new ModuleInfo()
        setOriginalMi(JSON.parse(JSON.stringify(mi)))
        setMi(mi)
        setLoading(false)
        setSwarmGatewayUrl(swarmGatewayUrl)
        setMode(FormMode.Creating)

        await _updateData()
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
        setOriginalMi(JSON.parse(JSON.stringify(mi)))
        setMi(mi)
        setVi(vi)
        setDpendenciesChecking(dependenciesChecking)
        setLoading(false)
        setSwarmGatewayUrl(swarmGatewayUrl)

        //   Object.keys(vi?.overlays ?? {}).length > 0
        //     ? [StorageTypes.Swarm, StorageTypes.Sia]
        //     : [StorageTypes.Swarm, StorageTypes.Sia, StorageTypes.Ipfs],
        // mode: FormMode.Deploying,

        await _updateData()
      }
    }
  )

  const _checkDependencies = async () => {
    const { getVersionInfo } = await initBGFunctions(browser)
    // const { dependenciesChecking deps, targetRegistry } = dependenciesChecking
    await Promise.all(
      dependenciesChecking.map((x) =>
        getVersionInfo(
          targetRegistry,
          x.name,
          DEFAULT_BRANCH_NAME,
          x.version
        ).then((y) => (x.isExists = !!y))
      )
    )
  }

  const _updateData = async () => {
    const { getRegistries, getTrustedUsers } = await initBGFunctions(browser)

    const registries = await getRegistries()
    const trustedUsers = await getTrustedUsers()
    const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)
    setRegistryOptions(
      prodRegistries.map((r) => ({
        key: r.url,
        text: r.url,
        value: r.url,
      }))
    )
    setTargetRegistry(prodRegistries[0]?.url || null)
    setTrustedUsers(trustedUsers)
    setTargetChain(chainByUri(typeOfUri(prodRegistries[0]?.url ?? '')))

    if (mode === FormMode.Creating) {
      await _updateCurrentAccount()
    }
  }

  const _updateCurrentAccount = async () => {
    const { getOwnership, getAddress } = await initBGFunctions(browser)
    const currentAccount = await getAddress(
      DefaultSigners.EXTENSION,
      targetChain
    )
    setCurrentAccount(currentAccount)
  }
  const _updateOwnership = async () => {
    const { getOwnership } = await initBGFunctions(browser)
    const owner = await getOwnership(targetRegistry, mi.name)
    setOwner(owner)
  }

  const _updateDeploymentStatus = async () => {
    // const s = this.state
    setDeploymentStatus(DeploymentStatus.Unknown)

    const { getVersionInfo, getModuleInfoByName } = await initBGFunctions(
      browser
    )
    const miF = await getModuleInfoByName(targetRegistry, mi.name)
    const deployed = vi
      ? await getVersionInfo(targetRegistry, miF.name, vi.branch, vi.version)
      : true
    const deploymentStatus = !miF
      ? DeploymentStatus.NewModule
      : deployed
      ? DeploymentStatus.Deployed
      : DeploymentStatus.NotDeployed
    setDeploymentStatus(deploymentStatus)
  }

  const _transferOwnership = async (newAccount: string) => {
    setNewOwnerLoading(true)

    const oldAccount = mi.author
    const { transferOwnership } = await initBGFunctions(browser)
    await transferOwnership(mi.registryUrl, mi.name, oldAccount, newAccount)
    setNewOwnerLoading(false)
    setNewOwnerDone(true)
    // console.log(mi.author)
  }
  const iconInputChangeHandler = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // const s = this.state
    const files = event.target.files
    if (files.length > 0) {
      const file = files[0]
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
      })
      mi.icon = {
        hash: null,
        uris: [base64],
      }
    } else {
      mi.icon = null
    }
    setMi(mi)
    console.log(mi)
  }
  const saveChanges = async () => {
    _addContextId(editContextId)
    try {
      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(targetRegistry, targetStorages, mi)

      setOriginalMi(JSON.parse(JSON.stringify(mi)))
      setUnderConstructionDetails(false)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })

      console.log(err.message)
      console.log(mi)
      console.log(targetRegistry)
      console.log(targetStorages)
    } finally {
    }
  }

  const pairWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    await pairWalletViaOverlay(targetChain)
    await _updateData()
  }

  const _addContextId = async (contextId: string) => {
    setEditContextIdLoading(true)

    const { addContextId } = await initBGFunctions(browser)
    await addContextId(targetRegistry, mi.name, contextId)
    setEditContextIdLoading(false)
    setEditContextIdDone(true)
  }

  const isNoStorage = targetStorages.length === 0
  const isNotNullCurrentAccount = !(
    !currentAccount ||
    currentAccount === '0x0000000000000000000000000000000000000000'
  )
  const isNotAnOwner =
    !!owner &&
    isNotNullCurrentAccount &&
    owner.toLowerCase() !== currentAccount.toLowerCase()
  const isAlreadyDeployed =
    !message && deploymentStatus === DeploymentStatus.Deployed

  const isManifestValid = mi?.name && mi?.title && mi?.type
  const isNewModule = deploymentStatus === DeploymentStatus.NewModule

  const isNotTrustedUser =
    isNotNullCurrentAccount &&
    !trustedUsers.find(
      (x) => x.account.toLowerCase() === currentAccount.toLowerCase()
    )

  const fileInput = useRef<HTMLInputElement>()
  const [st, setSt] = useState([])
  const onChange = (e) => {
    const files = e.target.files
    // console.log(files)
    const filesArr = Array.prototype.slice.call(files)
    // console.log(filesArr)
    setSt([
      // ...files,
      ...filesArr,
    ])
  }
  return (
    <div className={styles.wrapper}>
      {message ? (
        <Message
          positive={message.type === 'positive'}
          negative={message.type === 'negative'}
        >
          <Message.Header>{message.header}</Message.Header>
          {message.message.map((m, i) => (
            <p key={i} style={{ overflowWrap: 'break-word' }}>
              {m}
            </p>
          ))}
        </Message>
      ) : null}

      {isNotAnOwner ? (
        <Message
          error
          header="Action Forbidden"
          content={
            <React.Fragment>
              You can not deploy this module to the selected registry, because
              are not the module's owner.
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
              This version of the module has already been deployed to the
              selected registry. You can choose another registry or increment
              the module version number.
            </React.Fragment>
          }
        />
      ) : null}

      {isNewModule ? (
        <Message
          info
          header="New Module"
          content={
            <>
              This module will be published for the first time in the selected
              registry.
              {mi.contextIds && mi.contextIds.length > 0 ? (
                <>
                  <br />
                  The following Context IDs will be added by default:
                  <List as="ul" style={{ marginTop: '4px' }}>
                    {mi.contextIds.map((x, i) => (
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

      {isNotTrustedUser && deploymentStatus !== DeploymentStatus.Deployed ? (
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
      <div className={styles.mainInfoBlock}>
        <SettingWrapper
          className={styles.wrapperSettings}
          title="Social"
          children={
            <div className={styles.socialBlock}>
              <div className={styles.moduleTitle}> {mi.name}</div>

              <SettingItem
                title="Title"
                className={styles.item}
                component={<></>}
                children={
                  <input
                    value={mi.title ?? ''}
                    onChange={(e) => {
                      setMi({ ...mi, title: e.target.value })
                      console.log(mi)
                    }}
                    className={styles.inputTitle}
                  />
                }
              />
              <SettingItem
                title="Description"
                component={<></>}
                className={styles.item}
                children={
                  <input
                    className={styles.inputTitle}
                    value={mi.description ?? ''}
                    onChange={(e) => {
                      setMi({ ...mi, description: e.target.value })
                      console.log(mi)
                    }}
                  />
                }
              />
              <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={<textarea className={styles.fullDescription} />}
              />

              <div className={styles.iconBlock}>
                <div className={styles.imgBlock}>
                  <StorageRefImage
                    className={styles.img}
                    storageRef={mi.icon}
                  />
                  {/* <div className={styles.img}></div> */}

                  {st.map((x, i) => (
                    <span className={styles.imgTitle} key={i}>
                      {x.name}
                    </span>
                  ))}
                </div>

                <div className={styles.buttonIcon}>
                  <input
                    ref={fileInput}
                    type="file"
                    name="file"
                    id="file"
                    accept=".png, .svg"
                    className={styles.inputfile}
                    onChange={(e) => {
                      onChange(e)
                      iconInputChangeHandler(e)
                      console.log(mi.icon)
                    }}
                  />
                  <label htmlFor="file">Change icon</label>
                </div>
              </div>
            </div>
          }
        />
        <SettingWrapper
          title="Parameters"
          children={
            <div className={styles.parametersBlock}>
              <div className={styles.wrapperContextID}>
                <div className={styles.blockContextID}>
                  <h3 className={styles.blockContextIDTitle}>Context IDs</h3>
                  <button
                    disabled={mi.contextIds.length >= 1}
                    onClick={addButtonClickHandlerContext}
                    className={cn(styles.contextIDButton, {
                      [styles.contextIDButtonDisabled]:
                        mi.contextIds.length >= 1,
                    })}
                  />
                </div>
                {mi.contextIds.map((x, i) => (
                  <div key={i} className={styles.blockContext}>
                    <input
                      key={i}
                      className={styles.blockContextTitle}
                      placeholder={'Context ID (ex: example.com)'}
                      value={editContextId}
                      onChange={(e) => {
                        setEditContextId(e.target.value)
                      }}
                      // onBlur={() => {
                      //   _addContextId(editContextId)
                      // }}
                    />

                    <button
                      onClick={() => {
                        onDeleteChildContext(i)
                        setEditContextId('')
                      }}
                      className={styles.contextDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          }
        />
        <SettingWrapper
          title="Team"
          children={
            <div className={styles.ownershipBlock}>
              <div className={styles.wrapperAdmins}>
                <div className={styles.blockAdmins}>
                  <h3 className={styles.adminsTitle}>Admins</h3>
                  <button
                    onClick={addButtonClickHandler}
                    className={styles.adminsButton}
                  />
                </div>
                {author.authorForm.map((x, i) => (
                  <div key={i} className={styles.blockAuthors}>
                    <input
                      key={i}
                      className={styles.authorTitle}
                      placeholder={x.author}
                      onChange={(e) => e.target.value}
                    />
                    <button
                      onClick={onDeleteChild.bind(null, i)}
                      className={styles.authorDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </div>
      <div className={styles.linkNavigation}>
        <button
          onClick={() => setUnderConstructionDetails(false)}
          className={styles.back}
        >
          Back
        </button>
        <button onClick={() => saveChanges()} className={styles.push}>
          Push changes
        </button>
      </div>
    </div>
  )
}