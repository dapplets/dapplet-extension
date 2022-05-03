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
// import { Icon, List, Message } from 'semantic-ui-react'
import { Modal } from '../../components/Modal'

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

type Message = {
  type: 'negative' | 'positive'
  header: string
  message: string[]
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
  const transferOwnershipModal = React.createRef<any>()
  const addContextIdModal = React.createRef<any>()
  const fileInputRef = React.createRef<HTMLInputElement>()
  // ???
  const [originalMi, setOriginalMi] = useState<ModuleInfo>(new ModuleInfo())
  // type - FEATURE
  const [mi, setMi] = useState<ModuleInfo>(new ModuleInfo())
  const [vi, setVi] = useState<VersionInfo>()
  const [dependenciesChecking, setDpendenciesChecking] =
    useState<DependencyChecking[]>()
  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [message, setMessage] = useState<Message>(null)
  // ???
  const [registryOptions, setRegistryOptions] = useState([])
  const [owner, setOwner] = useState(null)
  // delete wallets
  // ??
  const [currentAccount, setCurrentAccount] = useState(null)

  const [deploymentStatus, setDeploymentStatus] = useState(
    DeploymentStatus.Unknown
  )
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
  const [isModal, setModal] = useState(false)
  const onClose = () => setModal(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await _updateData()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [mi, targetChain])

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
    setLoading(true)
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

    await _updateCurrentAccount()
    setLoading(false)
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

  const deployButtonClickHandler = async () => {
    const { deployModule, addTrustedUser } = await initBGFunctions(browser)

    mi.registryUrl = targetRegistry
    mi.author = currentAccount
    mi.type = ModuleTypes.Feature

    try {
      setLoading(true)
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

      setMessage({
        type: 'positive',
        header: 'Module was deployed',
        message: [`Script URL: ${result.scriptUrl}`],
      })
      setLoading(false)
      setUnderConstruction(false)
    } catch (err) {
      setLoading(false)
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
      setModal(true)
      console.log([err])
    } finally {
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
      setModal(true)
    } finally {
      // setLoading(false)
    }
  }

  const pairWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    await pairWalletViaOverlay(targetChain)
    await _updateData()
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
    !isAlreadyDeployed || mode === FormMode.Creating

  const [miTitle, setMiTitle] = useState(mi.title)
  const [miName, setMiName] = useState(mi.name)
  const [miDescription, setMiDescription] = useState(mi.description)

  return (
    <div className={styles.wrapper}>
      {message ? (
        <Modal
          visible={isModal}
          title={message.header}
          content={
            <>
              {message.message.map((m, i) => (
                <p key={i} style={{ overflowWrap: 'break-word' }}>
                  {m === `Cannot read properties of null (reading 'length')`
                    ? 'Please fill in the empty fields'
                    : m}
                </p>
              ))}
            </>
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
              <>
                <p>Change account to {owner}</p>

                <br />
                <p> Connect a new wallet</p>
              </>
            }
            footer={''}
            onClose={() => setUnderConstruction(false)}
          />
        ) : (
          <Modal
            visible={true}
            title={'Wallet is not connected'}
            content={
              'You can not deploy a module without a wallet. Connect a new wallet'
            }
            footer={''}
            onClose={() => setUnderConstruction(false)}
          />
        )
      ) : null}

      {isNotAnOwner ? (
        <Modal
          visible={isModal}
          title={'Action Forbidden'}
          content={` You can not deploy this module to the selected registry, because
           are not the module's owner.
           
           Change account to ${owner}`}
          footer={''}
          onClose={() => onClose()}
        />
      ) : null}

      {isNewModule ? (
        <Modal
          visible={isModal}
          title={'New Module'}
          content={<></>}
          footer={''}
          onClose={() => onClose()}
        />
      ) : null}

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
                    readOnly={mode === FormMode.Editing}
                    placeholder="Module ID like module_name.dapplet-base.eth"
                    onChange={(e) => {
                      mi.name = e.target.value
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
                    onChange={(e) => {
                      mi.title = e.target.value
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
                    onChange={(e) => {
                      mi.description = e.target.value
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
          // disabled={mi.description === null && mi.title === null}
          onClick={() => {
            deployButtonClickHandler()
          }}
          className={cn(styles.push, {
            // [styles.pushDisabled]: mi.description === null && mi.title === null,
          })}
        >
          Done
        </button>
      </div>
      <Modal
        visible={loading}
        title={'Loading new Dapplet'}
        content={
          'This modal window will close automatically after successful change'
        }
        footer={''}
        onClose={() => !loading}
      />
    </div>
  )
}
