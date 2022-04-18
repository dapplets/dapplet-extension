import React, { ReactElement, useState, useEffect, useMemo, FC } from 'react'
import cn from 'classnames'
import styles from './DappletsInfo.module.scss'
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
import {
  DEFAULT_BRANCH_NAME,
  ModuleTypes,
  StorageTypes,
} from '../../../../../common/constants'

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
export interface DappletsMainInfoProps {
  isDappletsDetails: boolean
  setDappletsDetail: (x) => void
  ModuleInfo: any
}
let _isMounted = false
export const DappletsMainInfo: FC<DappletsMainInfoProps> = (props) => {
  const { isDappletsDetails, setDappletsDetail, ModuleInfo } = props
  const bus = new Bus()
  const transferOwnershipModal = React.createRef<any>()
  const addContextIdModal = React.createRef<any>()
  const fileInputRef = React.createRef<HTMLInputElement>()
  const [originalMi, setOriginalMi] = useState(null)
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [vi, setVi] = useState<VersionInfo>(null)
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
  // targetChain: null,
  // targetStorages: [
  //     StorageTypes.Swarm,
  //     StorageTypes.Sia,
  //     StorageTypes.Ipfs
  // ],

  useEffect(() => {
    _isMounted = true
    const init = async () => {}
    init()
    return () => {
      _isMounted = false
      console.log(ModuleInfo)
    }
  }, [])
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
      return Promise.all([_updateCurrentAccount()])
    } else {
      return Promise.all([
        _updateOwnership(),
        _updateCurrentAccount(),
        _updateDeploymentStatus(),
        _checkDependencies(),
      ])
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
    await transferOwnership(targetRegistry, mi.name, newAccount, oldAccount)
    setNewOwnerLoading(false)
    setNewOwnerDone(true)
  }

  const _addContextId = async (contextId: string) => {
    setEditContextIdLoading(true)

    const { addContextId } = await initBGFunctions(browser)
    await addContextId(targetRegistry, mi.name, contextId)
    setEditContextIdLoading(false)
    setEditContextIdDone(true)
  }

  const _removeContextId = async (contextId: string) => {
    setEditContextIdLoading(true)

    const { removeContextId } = await initBGFunctions(browser)
    await removeContextId(targetRegistry, mi.name, contextId)
    setEditContextIdLoading(false)
    setEditContextIdDone(true)
  }

  const deployButtonClickHandler = async () => {
    setLoading(true)

    const { deployModule, addTrustedUser } = await initBGFunctions(browser)
    // const { mi, vi, targetRegistry, targetStorages, currentAccount, mode } =
    //   this.state

    try {
      const isNotNullCurrentAccount = !(
        !currentAccount ||
        currentAccount === '0x0000000000000000000000000000000000000000'
      )
      const isNotTrustedUser =
        isNotNullCurrentAccount &&
        !trustedUsers.find(
          (x) => x.account.toLowerCase() === currentAccount.toLowerCase()
        )
      if (isNotTrustedUser) {
        await addTrustedUser(currentAccount.toLowerCase())
      }

      const result =
        mode === FormMode.Creating
          ? await deployModule(mi, null, targetStorages, targetRegistry)
          : await deployModule(mi, vi, targetStorages, targetRegistry)
      setMessage({
        type: 'positive',
        header: 'Module was deployed',
        message: [`Script URL: ${result.scriptUrl}`],
      })
      setDeploymentStatus(DeploymentStatus.Deployed)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
    } finally {
      setLoading(false)
    }
  }

  const reuploadButtonClickHandler = async () => {
    setLoading(true)

    const { uploadModule } = await initBGFunctions(browser)

    try {
      const scriptUrl = await uploadModule(mi, vi, targetStorages)
      setMessage({
        type: 'positive',
        header: 'Module was reuploaded',
        message: [`Script URL: ${scriptUrl}`],
      })
      setDeploymentStatus(DeploymentStatus.Deployed)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
    } finally {
      setLoading(false)
    }
  }

  const pairWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    await pairWalletViaOverlay(targetChain)
    await _updateData()
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
  }

  const saveChanges = async () => {
    try {
      isSawing(true)

      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(targetRegistry, targetStorages, mi)
      isSawing(false)
      setOriginalMi(JSON.parse(JSON.stringify(mi)))
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
    } finally {
      isSawing(false)
    }
  }
  // const isNoStorage = targetStorages.length === 0
  // const isNotNullCurrentAccount = !(
  //   !currentAccount ||
  //   currentAccount === '0x0000000000000000000000000000000000000000'
  // )
  // const isNotWalletPaired = !isNotNullCurrentAccount && !!owner
  // const isNotAnOwner =
  //   !!owner &&
  //   isNotNullCurrentAccount &&
  //   owner.toLowerCase() !== currentAccount.toLowerCase()
  // const isAlreadyDeployed =
  //   !message && deploymentStatus === DeploymentStatus.Deployed
  // const isNewModule = deploymentStatus === DeploymentStatus.NewModule
  // const isNotTrustedUser =
  //   isNotNullCurrentAccount &&
  //   !trustedUsers.find(
  //     (x) => x.account.toLowerCase() === currentAccount.toLowerCase()
  //   )
  // const isDependenciesExist =
  //   dependenciesChecking.length > 0
  //     ? dependenciesChecking.every((x) => x.isExists === true)
  //     : true
  // // const isDependenciesLoading =
  // //   dependenciesChecking.length > 0
  // //     ? dependenciesChecking.every((x) => x.isExists === undefined)
  // //     : false
  // const isManifestValid = mi?.name && mi?.title && mi?.type
  // const isDeployButtonDisabled =
  //   loading ||
  //   deploymentStatus === DeploymentStatus.Deployed ||
  //   !isNotNullCurrentAccount ||
  //   isNotAnOwner ||
  //   isNoStorage ||
  //   // isDependenciesLoading ||
  //   !isDependenciesExist ||
  //   !isManifestValid
  // const isReuploadButtonDisabled =
  //   !isAlreadyDeployed || mode === FormMode.Creating || !vi
  const [miTitle = '', setMiTitle] = useState(mi.title)
  const [miDescription = '', setMiDescription] = useState(mi.description)
  return (
    <div className={styles.wrapper}>
      <div className={styles.mainInfoBlock}>
        <SettingWrapper
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
                    value={miTitle}
                    onChange={(e) => {
                      setMiTitle(e.target.value)
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
                    value={miDescription}
                    onChange={(e) => {
                      setMiDescription(e.target.value)
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
                  <img className={styles.img} src={mi.icon.uris[0]} />
                  <span className={styles.imgTitle}>Icon</span>
                </div>
                <div className={styles.buttonIcon}>
                  <button className={styles.addIcon}>Change icon</button>
                </div>
              </div>
            </div>
          }
        />
        <SettingWrapper
          title="Ownership"
          children={
            <div className={styles.ownershipBlock}>
              <SettingItem
                title="Ownership"
                component={<></>}
                className={styles.item}
                children={
                  <div className={styles.inputOwnershipBlock}>
                    <input
                      className={styles.inputOwnership}
                      placeholder="New owner adress"
                    />
                    <button className={styles.ownershipButton}>Change</button>
                  </div>
                }
              />
              <div className={styles.blockAdmins}>
                <h3 className={styles.adminsTitle}>Admins</h3>
                <button className={styles.adminsButton} />
              </div>
            </div>
          }
        />
      </div>
      <div className={styles.linkNavigation}>
        <button
          onClick={() => setDappletsDetail(false)}
          className={styles.back}
        >
          Back
        </button>
        <a className={styles.push}>Push changes</a>
      </div>
    </div>
  )
}
