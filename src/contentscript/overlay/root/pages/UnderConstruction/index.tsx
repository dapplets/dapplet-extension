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
  setUnderConstructionDetails: (x) => void
  setModuleInfo: (x) => void
  setModuleVersion: (x) => void
}
let _isMounted = false
export const UnderConstruction: FC<UnderConstruction> = (
  props: UnderConstruction
) => {
  // setUnderConstructionDetails: (x)=>void
  const {
    setUnderConstruction,
    setUnderConstructionDetails,
    setModuleInfo,
    setModuleVersion,
  } = props
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
  const [inputNameError, setInputNameError] = useState(null)
  const [inputTitleError, setInputTitleError] = useState(null)
  const [inputDescriptionError, setInputDescriptionError] = useState(null)
  const [inputFullDescriptionError, setFullInputDescriptionError] =
    useState(null)
  const onClose = () => setModal(false)

  const [isModalCreation, setModalCreation] = useState(false)
  const onCloseModalCreation = () => setModalCreation(false)
  const [isModalEndCreation, setModalEndCreation] = useState(false)
  const onCloseEndModalCreation = () => setModalCreation(false)
  const [isModalTransaction, setModalTransaction] = useState(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await _updateData()
    }
    init()
    console.log(mi)
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
  }

  const _updateCurrentAccount = async () => {
    const { getOwnership, getAddress } = await initBGFunctions(browser)
    const currentAccount = await getAddress(
      DefaultSigners.EXTENSION,
      targetChain
    )
    setCurrentAccount(currentAccount)
    setLoading(false)
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
      setModalTransaction(true)
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
      setModalTransaction(false)
      setModalEndCreation(true)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
      setModal(true)
      console.log([err])
    } finally {
      setModalTransaction(false)
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
                <p> Connect a new wallet</p>
              </div>
            }
            footer={''}
            onClose={() => setUnderConstruction(false)}
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
                      // setInputNameError(null)
                      mi.name = e.target.value
                      if (mi.name.length < 2) {
                        setInputNameError('error')
                      } else {
                        setInputNameError(null)
                      }
                    }}
                    className={cn(styles.inputTitle, {
                      [styles.inputNameDisabled]: inputNameError !== null,
                    })}
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
                      if (mi.title.length < 2) {
                        setInputTitleError('error')
                      } else {
                        setInputTitleError(null)
                      }
                    }}
                    className={cn(styles.inputTitle, {
                      [styles.inputNameDisabled]: inputTitleError !== null,
                    })}
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
                      if (mi.description.length < 2) {
                        setInputDescriptionError('error')
                      } else {
                        setInputDescriptionError(null)
                      }
                    }}
                    className={cn(styles.inputTitle, {
                      [styles.inputNameDisabled]:
                        inputDescriptionError !== null,
                    })}
                  />
                }
              />
              <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={
                  <textarea
                    onChange={(e) => {
                      e.target.value
                      if (e.target.value.length < 2) {
                        setFullInputDescriptionError('error')
                      } else {
                        setFullInputDescriptionError(null)
                      }
                    }}
                    className={cn(styles.fullDescription, {
                      [styles.inputNameDisabled]:
                        inputFullDescriptionError !== null,
                    })}
                  />
                }
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
          disabled={
            inputNameError !== null ||
            inputTitleError !== null ||
            inputDescriptionError !== null ||
            mi.name === null ||
            mi.title === null ||
            mi.description === null
            // ||
            // inputFullDescriptionError !== null
          }
          onClick={() => {
            setModalCreation(true)
            console.log(loading)

            // deployButtonClickHandler()
          }}
          className={cn(styles.push, {
            [styles.pushDisabled]:
              inputNameError !== null ||
              inputTitleError !== null ||
              inputDescriptionError !== null ||
              mi.name === null ||
              mi.title === null ||
              mi.description === null,
            //  ||
            // inputFullDescriptionError !== null,
          })}
        >
          Done
        </button>
      </div>
      <Modal
        visible={isModalCreation}
        title={'Initial Stake'}
        content={
          <div className={styles.modalCreationContent}>
            To create a Dapplet Under Construction you need to Stake 100 AUGe.
            You will get this stake back if you deploy this module within 2
            months. Otherwise you will lose it
          </div>
        }
        footer={
          <button
            className={styles.modalCreationContentButton}
            onClick={() => {
              deployButtonClickHandler()
              onCloseModalCreation()
              console.log(mi)
              console.log(vi)

              console.log(originalMi)
            }}
          >
            Ok, I agree
          </button>
        }
        onClose={() => onCloseModalCreation()}
      />
      <Modal
        visible={isModalTransaction}
        title={'Transaction confirmation'}
        content={''}
        footer={''}
        onClose={() => !isModalTransaction}
      />
      <Modal
        visible={isModalEndCreation}
        className={styles.titleModalEndCreation}
        title={`Congratulations, your "${mi.name}" has been created`}
        content={
          <div className={styles.modalEndCreationContent}>
            You have 2 months to deploy this dapplet. Otherwise, you will lose
            your Initial Steak.Also now you can add additional details,
            Tokenomics and Rewards to your dapplet
          </div>
        }
        footer={
          <div className={styles.modalEndCreationFooterBlock}>
            <button
              onClick={() => {
                setModuleInfo(mi)
                setUnderConstruction(false)

                setUnderConstructionDetails(true)
              }}
              className={styles.modalEndCreationFooterButton}
            >
              Go to the Details
            </button>
            <a
              className={styles.modalEndCreationFooterLink}
              onClick={() => setUnderConstruction(false)}
            >
              Remind Later
            </a>
          </div>
        }
        onClose={() => setUnderConstruction(false)}
      />
    </div>
  )
}
