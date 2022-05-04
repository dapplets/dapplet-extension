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
import './valid.scss'
import { Modal } from '../../components/Modal'
import { Icon, List, Message } from 'semantic-ui-react'

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
  setShowChildrenUnderConstraction: (x) => void
}

let _isMounted = false

export const UnderConstructionInfo: FC<UnderConstructionInfoProps> = (
  props
) => {
  const {
    setUnderConstructionDetails,
    ModuleInfo,
    ModuleVersion,
    setShowChildrenUnderConstraction,
  } = props

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
  const [contextDeleteNone, setContextDeleteNone] = useState(false)

  const newAuthorObject = {
    author: 'New admins',
  }
  const fileInput = useRef<HTMLInputElement>()
  const [st, setSt] = useState([])
  const node = useRef<HTMLButtonElement>()
  const nodeInput = useRef<HTMLInputElement>()
  const [isDisabledPush, setDisabledPush] = useState(true)
  const [isModal, setModal] = useState(false)
  const onClose = () => setModal(false)

  const [isModalPush, setModalPush] = useState(false)
  const onClosePush = () => setModalPush(false)
  const [isModalTransaction, setModalTransaction] = useState(false)
  const onCloseTransaction = () => setModalTransaction(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await _updateData()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [mi, st, targetChain])
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
  let newContextObject = ''
  const addButtonClickHandlerContext = () => {
    const newContext = Object.assign({}, mi)
    newContext.contextIds.push(
      // ...mi.contextIds,
      newContextObject
    )
    setMi(newContext)
    // setContextDeleteNone(false)
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

    // if (mode === FormMode.Creating) {
    await _updateCurrentAccount()
    // }
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
    setModalTransaction(true)
    try {
      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(targetRegistry, targetStorages, mi)

      setOriginalMi(JSON.parse(JSON.stringify(mi)))
      // setUnderConstructionDetails(false)
      setModalTransaction(false)
      setModalPush(true)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
      setModalTransaction(false)
      setModal(true)
      console.log(err.message)
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
  const isNotWalletPaired = !isNotNullCurrentAccount && !!owner
  const isNotAnOwner =
    !!owner &&
    isNotNullCurrentAccount &&
    owner.toLowerCase() !== currentAccount.toLowerCase()
  const isAlreadyDeployed =
    !message && deploymentStatus === DeploymentStatus.Deployed
  const isNewModule = deploymentStatus === DeploymentStatus.NewModule
  const isNotTrustedUser =
    isNotNullCurrentAccount &&
    !trustedUsers.find(
      (x) => x.account.toLowerCase() === currentAccount.toLowerCase()
    )
  const isDependenciesExist =
    dependenciesChecking && dependenciesChecking.length > 0
      ? dependenciesChecking.every((x) => x.isExists === true)
      : true
  const isDependenciesLoading =
    dependenciesChecking && dependenciesChecking.length > 0
      ? dependenciesChecking.every((x) => x.isExists === undefined)
      : false
  const isManifestValid = mi?.name && mi?.title && mi?.type
  const isDeployButtonDisabled =
    loading ||
    deploymentStatus === DeploymentStatus.Deployed ||
    !isNotNullCurrentAccount ||
    isNotAnOwner ||
    isNoStorage ||
    isDependenciesLoading ||
    !isDependenciesExist ||
    !isManifestValid
  const isReuploadButtonDisabled =
    !isAlreadyDeployed || mode === FormMode.Creating || !vi

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
        <Modal
          visible={isModal}
          title={message.header}
          content={
            <div className={styles.modalDefaultContent}>
              {message.message.map((m, i) => (
                <p key={i} style={{ overflowWrap: 'break-word' }}>
                  {m === `Cannot read properties of null (reading 'length')`
                    ? 'Please fill in the empty fields'
                    : m}
                </p>
              ))}
              <button
                onClick={() => onClose()}
                className={styles.modalDefaultContentButton}
              >
                Push Changes again
              </button>
            </div>
          }
          footer={''}
          onClose={() => onClose()}
        />
      ) : null}
      {!isNotNullCurrentAccount && !loading ? (
        owner ? (
          <Modal
            visible={true}
            title={'The wrong wallet'}
            content={
              <div className={styles.modalDefaultContent}>
                <p>Change account to {owner}</p>

                <br />
                <p> Connect a new wallet</p>
              </div>
            }
            footer={''}
            onClose={() => setUnderConstructionDetails(false)}
          />
        ) : (
          <Modal
            visible={true}
            title={'Wallet is not connected'}
            content={
              <div className={styles.modalDefaultContent}>
                You can not deploy a module without a wallet. Connect a new
                wallet
              </div>
            }
            footer={''}
            onClose={() => setUnderConstructionDetails(false)}
          />
        )
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
                      setDisabledPush(false)
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
                      setDisabledPush(false)
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
                      setDisabledPush(false)
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
                    // disabled={mi.contextIds.length >= 1}
                    onClick={addButtonClickHandlerContext}
                    className={cn(styles.contextIDButton, {
                      [styles.contextIDButtonDisabled]:
                        mi.contextIds &&
                        mi.contextIds.length &&
                        mi.contextIds.length >= 1,
                    })}
                  />
                </div>
                {mi &&
                  mi.contextIds &&
                  mi.contextIds.map((x, i) => (
                    <div key={i} className={styles.wrapperContext}>
                      <div className={styles.blockContext}>
                        <input
                          key={i}
                          ref={nodeInput}
                          className={styles.blockContextTitle}
                          placeholder={'Context ID (ex: example.com)'}
                          onChange={(e) => {
                            // setMi({
                            //   ...mi,
                            //   contextIds: [e.target.value],
                            // })
                            setEditContextId(e.target.value)
                            console.log(nodeInput.current?.value)
                            console.log(mi)
                          }}
                          // onBlur={() => {
                          //   _addContextId(editContextId)
                          // }}
                        />

                        <button
                          ref={node}
                          onClick={() => {
                            onDeleteChildContext(i)
                            setEditContextId('')
                          }}
                          className={cn(styles.contextDelete, {
                            [styles.contextDeleteNone]: contextDeleteNone,
                          })}
                        />
                      </div>
                      <button
                        disabled={nodeInput.current?.value.length < 2}
                        onClick={() => {
                          node.current?.classList.add('valid')
                          _addContextId(editContextId)
                        }}
                        className={cn(styles.addContext, {
                          [styles.addContextDisabled]:
                            nodeInput.current?.value.length < 2,
                        })}
                      >
                        ADD
                      </button>
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
                      onChange={(e) => {
                        // e.target.value
                        // setAuthor({ ...author, authorForm: [e.target.value] })
                        newAuthorObject.author = e.target.value
                        console.log(author)
                        setDisabledPush(false)
                      }}
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
          onClick={() => {
            setUnderConstructionDetails(false)
            setShowChildrenUnderConstraction(true)
          }}
          className={styles.back}
        >
          Back
        </button>
        <button
          disabled={isDisabledPush}
          onClick={() => {
            saveChanges()
          }}
          className={cn(styles.push, {
            [styles.pushDisabled]: isDisabledPush,
          })}
        >
          Push changes
        </button>
      </div>
      <Modal
        visible={isModalPush}
        title="Сhanges were accepted"
        content={
          <div className={styles.modalDefaultContent}>
            Your dapplet has been updated
            <button
              onClick={() => {
                setUnderConstructionDetails(false)
                setShowChildrenUnderConstraction(true)
              }}
              className={styles.modalDefaultContentButton}
            >
              OK
            </button>
          </div>
        }
        footer={''}
        onClose={() => {
          setUnderConstructionDetails(false)
          setShowChildrenUnderConstraction(true)
        }}
      />
      <Modal
        visible={isModalTransaction}
        title="Transaction confirmation"
        content={<div className={styles.modalDefaultContent}></div>}
        footer={''}
        onClose={() => {}}
      />
    </div>
  )
}
