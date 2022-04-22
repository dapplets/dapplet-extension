import React, {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  FC,
  useRef,
} from 'react'
import cn from 'classnames'
import styles from './UnderConstruction.module.scss'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'

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
import { Icon, Message } from 'semantic-ui-react'

// tracing.startTracing()

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
export interface UnderConstruction {
  setUnderConstruction: (x) => void
  // ModuleInfo: any
  // ModuleVersion: any
}
let _isMounted = false
export const UnderConstruction: FC<UnderConstruction> = (
  props: UnderConstruction
) => {
  const { setUnderConstruction } = props
  const bus = new Bus()
  // const transferOwnershipModal = React.createRef<any>()
  // const addContextIdModal = React.createRef<any>()
  const fileInputRef = React.createRef<HTMLInputElement>()
  // ???
  const [originalMi, setOriginalMi] = useState<ModuleInfo>(new ModuleInfo())
  // type - FEATURE
  const [mi, setMi] = useState<ModuleInfo>(new ModuleInfo())
  // const [vi, setVi] = useState<VersionInfo>()
  // const [dependenciesChecking, setDpendenciesChecking] =
  //   useState<DependencyChecking[]>()
  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(
    ChainTypes.ETHEREUM_GOERLI
  )
  const [message, setMessage] = useState(null)
  // ???
  const [registryOptions, setRegistryOptions] = useState([])
  // const [owner, setOwner] = useState(null)
  // delete wallets
  // ??
  const [currentAccount, setCurrentAccount] = useState(null)
  // const [newOwner, setNewOwner] = useState('')
  // const [newOwnerLoading, setNewOwnerLoading] = useState(false)
  // const [newOwnerDone, setNewOwnerDone] = useState(false)
  // const [editContextId, setEditContextId] = useState('')
  // const [editContextIdLoading, setEditContextIdLoading] = useState(false)
  // const [editContextIdDone, setEditContextIdDone] = useState(false)
  // const [deploymentStatus, setDeploymentStatus] = useState(
  //   DeploymentStatus.Unknown
  // )
  const [trustedUsers, setTrustedUsers] = useState([])
  // ???
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  // if form onli create - ?
  const [mode, setMode] = useState(FormMode.Creating)
  // ???
  const [saving, isSaving] = useState(false)
  const [targetStorages, setTargetStorages] = useState([
    StorageTypes.Swarm,
    StorageTypes.Sia,
    StorageTypes.Ipfs,
  ])

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      // await _updateOwnership(),
      await _updateData()
      // await _updateCurrentAccount(),
      // await _updateDeploymentStatus(), await _checkDependencies()
      console.log(mi)
      // console.log(originalMi)

      // console.log(vi)
      console.log(mode)
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [mi])

  bus.subscribe(
    'data',
    async ({ mi, vi }: { mi: ModuleInfo; vi: VersionInfo }) => {
      const { getSwarmGateway } = await initBGFunctions(browser)
      const swarmGatewayUrl = await getSwarmGateway()

      if (
        mi === null
        //  && vi === null
      ) {
        // New module
        const mi = new ModuleInfo()
        setOriginalMi(JSON.parse(JSON.stringify(mi)))
        setMi(mi)
        setLoading(false)
        setSwarmGatewayUrl(swarmGatewayUrl)
        setMode(FormMode.Creating)

        // await _updateData()
        // }
        //  else {
        // Deploy module
        // const dependencies = vi?.dependencies
        //   ? Object.entries(vi.dependencies).map(([name, version]) => ({
        //       name: name,
        //       version: version,
        //       type: DependencyType.Dependency,
        //     }))
        //   : []
        // const interfaces = vi?.interfaces
        //   ? Object.entries(vi.interfaces).map(([name, version]) => ({
        //       name: name,
        //       version: version,
        //       type: DependencyType.Interface,
        //     }))
        //   : []
        // const dependenciesChecking = [...dependencies, ...interfaces]
        // setOriginalMi(JSON.parse(JSON.stringify(mi)))
        // setMi(mi)
        // setVi(vi)
        // setDpendenciesChecking(dependenciesChecking)
        // setLoading(false)
        // setSwarmGatewayUrl(swarmGatewayUrl)

        //   Object.keys(vi?.overlays ?? {}).length > 0
        //     ? [StorageTypes.Swarm, StorageTypes.Sia]
        //     : [StorageTypes.Swarm, StorageTypes.Sia, StorageTypes.Ipfs],
        // mode: FormMode.Deploying,

        // await _updateData()
      }
    }
  )

  // const _checkDependencies = async () => {
  //   const { getVersionInfo } = await initBGFunctions(browser)
  //   // const { dependenciesChecking deps, targetRegistry } = dependenciesChecking
  //   await Promise.all(
  //     dependenciesChecking.map((x) =>
  //       getVersionInfo(
  //         targetRegistry,
  //         x.name,
  //         DEFAULT_BRANCH_NAME,
  //         x.version
  //       ).then((y) => (x.isExists = !!y))
  //     )
  //   )
  // }

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
    // console.log(registries)
    // console.log(trustedUsers)
    // console.log(prodRegistries)
    // console.log(targetChain)
    console.log(mi)
    if (mode === FormMode.Creating) {
      // return Promise.all([_updateCurrentAccount()])
      await _updateCurrentAccount()
    }
    // else {
    //   return Promise.all([
    //     // _updateOwnership(),
    //     _updateCurrentAccount(),
    //     // _updateDeploymentStatus(),
    //     // _checkDependencies(),
    //   ])
    // }
  }

  const _updateCurrentAccount = async () => {
    const { getOwnership, getAddress } = await initBGFunctions(browser)
    const currentAccount = await getAddress(
      DefaultSigners.EXTENSION,
      targetChain
    )
    setCurrentAccount(currentAccount)
    // console.log(targetChain)

    // console.log(currentAccount)
  }
  // const _updateOwnership = async () => {
  //   const { getOwnership } = await initBGFunctions(browser)
  //   const owner = await getOwnership(targetRegistry, mi.name)
  //   setOwner(owner)
  // }

  // const _updateDeploymentStatus = async () => {
  //   // const s = this.state
  //   // setDeploymentStatus(DeploymentStatus.NewModule)

  //   const { getVersionInfo, getModuleInfoByName } = await initBGFunctions(
  //     browser
  //   )
  //   const miF = await getModuleInfoByName(targetRegistry, mi.name)
  //   const deployed = vi
  //     ? await getVersionInfo(targetRegistry, miF.name, vi.branch, vi.version)
  //     : true
  //   const deploymentStatus = !miF
  //     ? DeploymentStatus.NewModule
  //     : deployed
  //     // ? DeploymentStatus.Deployed
  //     // : DeploymentStatus.NotDeployed
  //   setDeploymentStatus(deploymentStatus)
  // }

  const _transferOwnership = async (newAccount: string) => {
    // setNewOwnerLoading(true)

    const oldAccount = mi.author
    const { transferOwnership } = await initBGFunctions(browser)
    await transferOwnership(mi.registryUrl, mi.name, oldAccount, newAccount)
    // setNewOwnerLoading(false)
    // setNewOwnerDone(true)
    // console.log(mi.author)
  }

  // const _addContextId = async (contextId: string) => {
  //   setEditContextIdLoading(true)

  //   const { addContextId } = await initBGFunctions(browser)
  //   await addContextId(targetRegistry, mi.name, contextId)
  //   setEditContextIdLoading(false)
  //   setEditContextIdDone(true)
  // }

  // const _removeContextId = async (contextId: string) => {
  //   setEditContextIdLoading(true)

  //   const { removeContextId } = await initBGFunctions(browser)
  //   await removeContextId(targetRegistry, mi.name, contextId)
  //   setEditContextIdLoading(false)
  //   setEditContextIdDone(true)
  // }

  const deployButtonClickHandler = async () => {
    // setLoading(true)

    const { deployModule, addTrustedUser } = await initBGFunctions(browser)
    // const { mi, vi, targetRegistry, targetStorages, currentAccount, mode } =
    //   this.state

    mi.registryUrl = targetRegistry
    mi.author = currentAccount
    mi.type = ModuleTypes.Feature
    console.log(mi)
    console.log('lala')
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
        mode === FormMode.Creating &&
        (await deployModule(mi, null, targetStorages, targetRegistry))
      // : await deployModule(mi, vi, targetStorages, targetRegistry)
      setMessage({
        type: 'positive',
        header: 'Module was deployed',
        message: [`Script URL: ${result.scriptUrl}`],
      })
      // setDeploymentStatus(DeploymentStatus.NewModule)
      setUnderConstruction(false)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
      console.log([err])
    } finally {
      // setLoading(false)
    }
  }

  const reuploadButtonClickHandler = async () => {
    // setLoading(true)

    const { uploadModule } = await initBGFunctions(browser)

    try {
      const scriptUrl = await uploadModule(mi, targetStorages)
      setMessage({
        type: 'positive',
        header: 'Module was reuploaded',
        message: [`Script URL: ${scriptUrl}`],
      })
      // setDeploymentStatus(DeploymentStatus.Deployed)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
        // console.log();
      })
    } finally {
      // setLoading(false)
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
    // console.log(mi)
  }

  const saveChanges = async () => {
    try {
      // isSawing(true)

      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(targetRegistry, targetStorages, mi)
      // isSawing(false)
      setOriginalMi(JSON.parse(JSON.stringify(mi)))
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })

      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(targetRegistry, targetStorages, mi)
      console.log(editModuleInfo, 'lll')

      console.log(err.message)
    } finally {
      // isSawing(false)
    }
  }

  const isNoStorage = targetStorages.length === 0
  const isNotNullCurrentAccount = !(
    !currentAccount ||
    currentAccount === '0x0000000000000000000000000000000000000000'
  )
  const isNotWalletPaired = !isNotNullCurrentAccount
  // && !!owner
  const isNotAnOwner =
    // !!owner &&
    isNotNullCurrentAccount
  //  &&
  // owner.toLowerCase() !== currentAccount.toLowerCase()
  // const isAlreadyDeployed =
  //   !message && deploymentStatus === DeploymentStatus.Deployed
  // const isNewModule = deploymentStatus === DeploymentStatus.NewModule
  // const isNotTrustedUser =
  //   isNotNullCurrentAccount &&
  //   !trustedUsers.find(
  //     (x) => x.account.toLowerCase() === currentAccount.toLowerCase()
  //   )

  const isManifestValid = mi?.name && mi?.title && mi?.type
  const isDeployButtonDisabled =
    loading ||
    // deploymentStatus === DeploymentStatus.Deployed ||
    !isNotNullCurrentAccount ||
    isNotAnOwner ||
    isNoStorage ||
    // isDependenciesLoading ||
    // !isDependenciesExist ||
    !isManifestValid
  const isReuploadButtonDisabled =
    // !isAlreadyDeployed ||
    mode === FormMode.Creating
  //  || !vi

  const [miTitle, setMiTitle] = useState(mi.title)
  const [miName, setMiName] = useState(mi.name)
  const [miDescription, setMiDescription] = useState(mi.description)

  return (
    <div className={styles.wrapper}>
      {!isNotNullCurrentAccount ? (
        // (
        // owner ?
        // (
        //   <Message
        //     warning
        //     header="The wrong wallet"
        //     content={
        //       <React.Fragment>
        //         {/* Change account to {owner} */}
        //         <br />
        //         Connect a new wallet{' '}
        //         <Icon name="chain" link onClick={() => pairWallet()} />
        //       </React.Fragment>
        //     }
        //   />
        // ) :
        <Message
          warning
          header="Wallet is not connected"
          content={
            <React.Fragment>
              You can not deploy a module without a wallet.
              <br />
              Connect a new wallet{' '}
              <Icon name="chain" link onClick={() => pairWallet()} />
            </React.Fragment>
          }
        />
      ) : // )
      null}
      {/* {message && <div>{message}</div>} */}

      <div className={styles.mainInfoBlock}>
        <SettingWrapper
          title="Social"
          children={
            <div className={styles.socialBlock}>
              <SettingItem
                title="Name"
                className={styles.item}
                component={<></>}
                children={
                  <input
                    required
                    // label="Module Name"
                    readOnly={mode === FormMode.Editing}
                    placeholder="Module ID like module_name.dapplet-base.eth"
                    // value={miName ?? ''}
                    onChange={(e) => {
                      // setMiName(e.target.value)
                      mi.name = e.target.value
                      // console.log(mi)
                      // console.log(originalMi)
                      // // setMi()
                      // // console.log()
                      // console.log(trustedUsers)
                      // console.log(targetRegistry)
                      // console.log(targetChain)
                      // setMiName(e.target.value)
                      // if (vi) vi.name = e.target.value
                      // setMi()
                      // setVi(vi)
                    }}
                    className={styles.inputTitle}
                  />
                }
              />
              <SettingItem
                title="Title"
                className={styles.item}
                component={<></>}
                children={
                  <input
                    required
                    placeholder="A short name of your module"
                    // value={miTitle ?? ''}
                    onChange={(e) => {
                      mi.title = e.target.value
                      // setMiTitle(e.target.value)
                      // setMiTitle(e.target.value)
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
                    required
                    placeholder="A small description of what your module does"
                    // value={miDescription ?? ''}
                    onChange={(e) => {
                      mi.description = e.target.value
                      // setMi(mi)
                      // setMiDescription(e.target.value)
                    }}
                    className={styles.inputTitle}
                  />
                }
              />
              <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={<textarea className={styles.fullDescription} />}
              />
            </div>
          }
        />
      </div>
      <div className={styles.linkNavigation}>
        <button
          onClick={() => setUnderConstruction(false)}
          className={styles.back}
        >
          Back
        </button>
        <button
          onClick={() => {
            deployButtonClickHandler()
            // console.log(mi)
            // console.log(originalMi)
            // console.log(targetRegistry)
            // console.log(targetStorages)
          }}
          className={styles.push}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// export interface MessageProps {
//   title: string
//   subtitle?: string
//   link?: string
// }

// export const MessageNew = ({
//   title,
//   subtitle = '',
//   link = '',
// }: MessageProps): ReactElement => {
//   return (
//     <div className={styles.wrapper}>
//       <h6 className={styles.title}>{title}</h6>
//       {subtitle?.length > 0 && <p className={styles.subtitle}>{subtitle}</p>}
//       {link?.length > 0 && (
//         <a href={link} className={styles.link}>
//           Go to store
//         </a>
//       )}
//     </div>
//   )
// }
