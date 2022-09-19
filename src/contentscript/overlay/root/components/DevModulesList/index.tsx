import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { DEFAULT_BRANCH_NAME, StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { Modal } from '../Modal'
import { StorageRefImage } from '../StorageRefImage'
import styles from './DevModulesList.module.scss'

enum DeploymentStatus {
  Unknown,
  Deployed,
  NotDeployed,
  NewModule,
}

enum FormMode {
  Deploying,
  Creating,
  Editing,
}
enum DependencyType {
  Dependency,
  Interface,
}
type DependencyChecking = {
  name: string
  version: string
  type: DependencyType
  isExists?: boolean
}

interface PropsDevModule {
  setDappletsDetail: (x) => void
  modules: {
    module: ModuleInfo
    versions: VersionInfo[]
    isDeployed: boolean[]
  }
  onDetailsClick: (x: any, y: any) => void
  setModuleInfo: (x) => void
  setModuleVersion: (x) => void

  setUnderConstructionDetails: (x) => void
  isLocalhost?: boolean
  setUpdate?: (x) => void

  isLoadingDeploy?: boolean
  setLoadingDeploy?: () => void
  setLoadingDeployFinally?: () => void
  setOpenWallet?: () => void
  connectedDescriptors?: []
  selectedWallet?: string
  setCurrentAccount?: (x: any) => void
  currentAccount?: any
}
let isMounted = false
export const DevModule: FC<PropsDevModule> = (props) => {
  const {
    modules,
    onDetailsClick,
    setDappletsDetail,
    setModuleInfo,
    setModuleVersion,
    setUnderConstructionDetails,
    isLocalhost = false,
    setUpdate,
    isLoadingDeploy,
    setLoadingDeploy,
    setLoadingDeployFinally,
    setOpenWallet,
    connectedDescriptors,
    selectedWallet,
    currentAccount,
    setCurrentAccount,
  } = props

  const [originalMi, setOriginalMi] = useState<ModuleInfo>(null)
  const [mi, setMi] = useState(modules.module)
  const [vi, setVi] = useState(modules.versions[0])
  const [targetRegistry, setTargetRegistry] = useState(null)

  const [trustedUsers, setTrustedUsers] = useState([])
  const [mode, setMode] = useState<FormMode>(null)
  const [targetStorages, setTargetStorages] = useState([
    StorageTypes.Swarm,
    StorageTypes.Sia,
    StorageTypes.Ipfs,
  ])
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [deploymentStatus, setDeploymentStatus] = useState(DeploymentStatus.Unknown)
  const [owner, setOwner] = useState(null)
  const [ownerDev, setOwnerDev] = useState(null)
  const [dependenciesChecking, setDpendenciesChecking] = useState<DependencyChecking[]>([])
  const nodeButton = useRef<HTMLButtonElement>()
  const [textButtonDeploy, setTextButtonDeploy] = useState('Deploy')

  const [messageError, setMessageError] = useState(null)
  const [isModalError, setModalError] = useState(false)
  const [isModalErrorOwner, setModalErrorOwner] = useState(false)
  const onCloseError = () => setModalError(false)
  const onCloseErrorOwner = () => setModalErrorOwner(false)
  const [isNotAccountModal, setNotAccountModal] = useState(false)
  const [isNewModule, setNewModule] = useState(false)
  const onCloseNewModule = () => {
    setNewModule(false)
  }
  const [registryActive, setRegistryActive] = useState(null)
  const [isDeployNewModule, setDeployNewModule] = useState(false)
  const [admins, setAdmins] = useState(null)
  const [isAdmin, setIsAdmins] = useState(false)
  useEffect(() => {
    isMounted = true

    const init = async () => {
      await _updateData()
    }
    init()
    return () => {
      isMounted = false
    }
  }, [
    targetChain,
    currentAccount,
    modules,
    isLoadingDeploy,
    isModalError,
    isModalErrorOwner,
    owner,
    isNewModule,
    isDeployNewModule,
    nodeButton,
  ])

  const visible = (hash: string): string => {
    if (hash.length > 28) {
      const firstFourCharacters = hash.substring(0, 7)
      const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)

      return `${firstFourCharacters}...${lastFourCharacters}`
    } else {
      return hash
    }
  }

  const _updateData = async () => {
    const { getRegistries, getTrustedUsers } = await initBGFunctions(browser)

    const registries = await getRegistries()
    const trustedUsers = await getTrustedUsers()
    const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)

    if (mi === null && vi === null) {
      const mi = new ModuleInfo()
      // setOriginalMi(JSON.parse(JSON.stringify(mi)))
      setMi(mi)

      setMode(FormMode.Creating)
    } else {
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
      // setOriginalMi(JSON.parse(JSON.stringify(mi)))
      setMi(mi)
      setVi(vi)

      if (isMounted) {
        setDpendenciesChecking(dependenciesChecking)
        setTargetStorages(
          Object.keys(vi?.overlays ?? {}).length > 0
            ? [StorageTypes.Swarm, StorageTypes.Sia]
            : [StorageTypes.Swarm, StorageTypes.Sia, StorageTypes.Ipfs]
        )
        setMode(FormMode.Deploying)
        setTargetRegistry(prodRegistries[0]?.url || null)
        setTrustedUsers(trustedUsers)
        setTargetChain(chainByUri(typeOfUri(prodRegistries[0]?.url ?? '')))
      }
    }

    if (mode === FormMode.Creating) {
      await _updateCurrentAccount()
      await updateDataLocalhost()
      await getAdmins()
    } else {
      return Promise.all([
        _updateOwnership(),
        _updateCurrentAccount(),
        _updateDeploymentStatus(),
        _checkDependencies(),
        updateDataLocalhost(),
        getAdmins(),
      ])
    }
  }

  const getAdmins = async () => {
    if (!targetRegistry || !mi.name) return
    const { getAdmins } = await initBGFunctions(browser)
    const authors = await getAdmins(targetRegistry, mi.name)
    if (isMounted) {
      setAdmins(authors)
      const unificationAdmins = authors.map((e) => e.toLowerCase())
      const includesAdmins = unificationAdmins.includes(currentAccount)
      setIsAdmins(includesAdmins)
    }
  }
  const _updateOwnership = async () => {
    if (targetRegistry && mi.name) {
      const { getOwnership } = await initBGFunctions(browser)

      const owner = await getOwnership(targetRegistry, mi.name)
      if (isMounted) {
        setOwner(owner)
      }
    } else {
      return
    }
  }
  const _updateDeploymentStatus = async () => {
    if (isMounted) {
      setDeploymentStatus(DeploymentStatus.Unknown)
    }

    const { getVersionInfo, getModuleInfoByName } = await initBGFunctions(browser)
    const miF = await getModuleInfoByName(targetRegistry, mi.name)
    const deployed = vi
      ? await getVersionInfo(targetRegistry, mi.name, vi.branch, vi.version)
      : true
    const deploymentStatus = !miF
      ? DeploymentStatus.NewModule
      : deployed
      ? DeploymentStatus.Deployed
      : DeploymentStatus.NotDeployed
    if (isMounted) {
      setDeploymentStatus(deploymentStatus)
    }
  }
  const _updateCurrentAccount = async () => {
    if (targetChain) {
      const { getAddress } = await initBGFunctions(browser)
      const currentAccount = await getAddress(DefaultSigners.EXTENSION, targetChain)
      if (isMounted) {
        setCurrentAccount(currentAccount)
      }
    } else {
      return
    }
  }
  const _checkDependencies = async () => {
    const { getVersionInfo } = await initBGFunctions(browser)

    await Promise.all(
      dependenciesChecking.map((x) =>
        getVersionInfo(targetRegistry, x.name, DEFAULT_BRANCH_NAME, x.version).then(
          (y) => (x.isExists = !!y)
        )
      )
    )
  }

  const deployButtonClickHandler = async (e) => {
    const { deployModule, addTrustedUser } = await initBGFunctions(browser)
    let newDescriptors
    let isOwner
    const unificationAdmins = admins.map((e) => e.toLowerCase())
    const includesAdmins = unificationAdmins.includes(currentAccount)

    if (connectedDescriptors && connectedDescriptors.length > 0) {
      newDescriptors = connectedDescriptors.find((x: any) => x.type === selectedWallet)
    }
    if (connectedDescriptors && connectedDescriptors.length > 0) {
      isOwner = connectedDescriptors.find((x: any) => {
        if (owner && x.account === owner.toLowerCase()) {
          return x.account
        }
      })
    }
    const isNotNullCurrentAccount = !(
      !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
    )
    const isNotTrustedUser =
      isNotNullCurrentAccount &&
      !trustedUsers.find((x) => x.account.toLowerCase() === currentAccount.toLowerCase())
    if (isNotTrustedUser) {
      await addTrustedUser(currentAccount.toLowerCase())
    }
    if (!isNotNullCurrentAccount || (!isOwner && deploymentStatus !== 3 && !includesAdmins)) {
      setNotAccountModal(true)
    } else if (isOwner && isOwner.account !== newDescriptors.account && deploymentStatus !== 3) {
      setModalErrorOwner(true)
    } else {
      try {
        setLoadingDeploy()
        nodeButton.current.classList.add('dappletsIsLoadingDeploy')

        if (deploymentStatus === 3) {
          setNewModule(true)
        } else {
          mode === FormMode.Creating
            ? await deployModule(mi, null, targetStorages, targetRegistry)
            : await deployModule(mi, vi, targetStorages, targetRegistry)

          setDeploymentStatus(DeploymentStatus.Deployed)
          setUpdate(true)
        }
      } catch (err) {
        console.log(err)

        setMessageError({
          type: 'negative',
          header: 'Publication error',
          message: [err.message],
        })
        if (err.message) {
          nodeButton.current.classList.remove('dappletsIsLoadingDeploy')
          const messageErr = err.message.toLowerCase()
          messageErr.includes(' are not the owner of this module') ? setModalErrorOwner(true) : null
        }

        setModalError(true)
        setNotAccountModal(false)
      } finally {
        setLoadingDeployFinally()
        await _updateData()
      }
    }
  }
  const connectWallet = async () => {
    setNotAccountModal(false)
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    try {
      await pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      await _updateData()
    } catch (e) {
      console.log(e)
    }
  }
  const deployNewModule = async () => {
    const { deployModule } = await initBGFunctions(browser)
    try {
      setLoadingDeploy()
      nodeButton.current.classList.add('dappletsIsLoadingDeploy')

      onCloseNewModule()
      mode === FormMode.Creating
        ? await deployModule(mi, null, targetStorages, targetRegistry)
        : await deployModule(mi, vi, targetStorages, targetRegistry)

      setDeploymentStatus(DeploymentStatus.Deployed)
      setUpdate(true)
    } catch (err) {
      console.log(err)

      setMessageError({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
      if (err.message) {
        nodeButton.current.classList.remove('dappletsIsLoadingDeploy')
        const messageErr = err.message.toLowerCase()
        messageErr.includes(' are not the owner of this module') ? setModalErrorOwner(true) : null
      }

      setModalError(true)
      setNotAccountModal(false)
    } finally {
      setLoadingDeployFinally()
      await _updateData()
    }
  }

  const updateDataLocalhost = async () => {
    const { getRegistries, getOwnership } = await initBGFunctions(browser)
    const registries = await getRegistries()

    const newRegistries = registries
      .filter((r) => r.isDev === false && r.isEnabled !== false)
      .map((x, i) => x.url)
    if (isMounted) {
      setRegistryActive(newRegistries[0])
    }
    const newOwner = await getOwnership(newRegistries[0], mi.name)
    if (isMounted) {
      setOwnerDev(newOwner)
    }
  }

  return (
    <>
      <div className={styles.dappletsBlock}>
        <StorageRefImage storageRef={mi.icon} />

        <div className={styles.dappletsInfo}>
          <div className={styles.dappletsTags}>
            {vi && vi.version ? (
              <div className={styles.dappletsVersion}>{vi.version}</div>
            ) : (
              <div className={styles.dappletsVersionUC}>Under Construction</div>
            )}

            {vi && vi.branch && vi.branch !== 'default' && (
              <div style={{ margin: '0 3px 0 0px' }} className={styles.dappletsBranch}>
                {vi.branch}
              </div>
            )}
            {modules.isDeployed[0] === false && (
              <div className={styles.dappletsNotDeploy}>not deployed</div>
            )}
          </div>

          <div className={styles.blockInfo}>
            <h3 className={styles.dappletsTitle}>{mi.title}</h3>
            {mi.isUnderConstruction ? (
              <span
                onClick={() => {
                  onDetailsClick(mi, vi)

                  setUnderConstructionDetails(true)
                  setModuleInfo(mi)
                  setModuleVersion(vi)
                }}
                className={styles.dappletsSettingsIsUnderConstructionBlock}
              >
                <button className={styles.dappletsSettingsIsUnderConstruction} />
                <span className={styles.dappletsSettingsIsTocenomics} />
              </span>
            ) : (
              <button
                className={cn(styles.dappletsSettings, {
                  [styles.dappletsSettingsRegistry]: mi.author !== null,
                  [styles.noneVisible]: isLocalhost,
                })}
                onClick={() => {
                  // TODO: DELETE J add contextID
                  mi.contextIds = []
                  onDetailsClick(mi, vi)
                  setDappletsDetail(true)

                  setModuleInfo(mi)
                  setModuleVersion(vi)
                }}
              />
            )}
            {mi.isUnderConstruction || !isLocalhost ? null : (
              <button
                ref={nodeButton}
                disabled={isLoadingDeploy}
                onClick={(e) => {
                  modules.isDeployed?.[0] === false &&
                    _updateCurrentAccount().then(() => deployButtonClickHandler(e))
                }}
                className={cn(styles.dappletsReupload, {
                  [styles.dappletDeploy]: modules.isDeployed?.[0] !== false,
                })}
              >
                {nodeButton.current &&
                nodeButton.current?.classList.contains('dappletsIsLoadingDeploy')
                  ? ''
                  : textButtonDeploy}
              </button>
            )}
          </div>
          <div className={styles.dappletsLabel}>
            {mi.name && (
              <div>
                <span className={styles.dappletsLabelSpan}>Name:</span>
                <label className={cn(styles.dappletsLabelSpan, styles.dappletsLabelSpanInfo)}>
                  {mi.name}
                </label>
              </div>
            )}

            {(mi.author || ownerDev) && (
              <div>
                <span className={styles.dappletsLabelSpan}>Owner:</span>
                <label className={cn(styles.dappletsLabelSpan, styles.dappletsLabelSpanInfo)}>
                  {mi.author ? visible(` ${mi.author}`) : visible(` ${ownerDev}`)}
                </label>
              </div>
            )}
            {isLocalhost && currentAccount && isAdmin ? (
              <div>
                <span className={styles.dappletsLabelSpan}>Admin:</span>
                <label className={cn(styles.dappletsLabelSpan, styles.dappletsLabelSpanInfo)}>
                 {visible(`${currentAccount}`)}
                </label>
              </div>
            )
             :null

            }

            <div>
              <span className={styles.dappletsLabelSpan}>Type:</span>
              <label className={cn(styles.dappletsLabelSpan, styles.dappletsLabelSpanInfo)}>
                {mi.type}
              </label>
            </div>
          </div>
        </div>
      </div>

      {isNotAccountModal ? (
        owner ? (
          <Modal
            visible={isNotAccountModal}
            title={'The wrong wallet'}
            classNameContent={styles.isNotAccountModalOwner}
            content={
              <div className={styles.modalDefaultContent}>
                <p style={{ overflowWrap: 'break-word' }}>Connect account to {owner}</p>

                <br />
                <button onClick={connectWallet} className={styles.modalDefaultContentButton}>
                  Connect a new wallet
                </button>
              </div>
            }
            footer={''}
            onClose={() => setNotAccountModal(false)}
          />
        ) : (
          <Modal
            visible={isNotAccountModal}
            title={'Wallet is not connected'}
            classNameContent={styles.isNotAccountModalOwner}
            content={
              <div className={styles.modalDefaultContent}>
                <p style={{ overflowWrap: 'break-word' }}>
                  You can not deploy a module without a wallet.
                </p>

                <br />
                <button onClick={connectWallet} className={styles.modalDefaultContentButton}>
                  Connect a new wallet
                </button>
              </div>
            }
            footer={''}
            onClose={() => setNotAccountModal(false)}
          />
        )
      ) : null}

      {messageError ? (
        <Modal
          visible={isModalError}
          title={messageError.header}
          classNameWrapper={styles.modalDefaultWrapper}
          content={
            <div className={styles.modalDefaultContent}>
              {messageError.message.map((m, i) => (
                <p key={i} className={styles.modalDefaultContentText}>
                  {m === `Cannot read properties of null (reading 'length')`
                    ? 'Please fill in the empty fields'
                    : m}
                </p>
              ))}

              <button onClick={() => onCloseError()} className={styles.modalDefaultContentButton}>
                Ok
              </button>
            </div>
          }
          footer={''}
          onClose={() => onCloseError()}
        />
      ) : null}

      <Modal
        visible={isModalErrorOwner}
        title={'THE WRONG WALLET'}
        classNameWrapper={styles.modalDefaultWrapper}
        content={
          <div className={styles.modalDefaultContent}>
            <p className={styles.modalDefaultContentText}></p>

            <button
              onClick={() => {
                setOpenWallet()
                onCloseErrorOwner()
              }}
              className={styles.modalDefaultContentButton}
            >
              GO TO THE WALLETS
            </button>
          </div>
        }
        footer={''}
        onClose={() => onCloseErrorOwner()}
      />
      <Modal
        visible={isNewModule}
        onFewFunction={() => {
          nodeButton.current.classList.remove('dappletsIsLoadingDeploy')
          setLoadingDeployFinally()
        }}
        title={'Deploy new module'}
        classNameWrapper={styles.modalDefaultWrapper}
        content={
          <div className={styles.modalDefaultContent}>
            <p className={styles.modalDefaultContentText}>
              You deploy the first version of the "{mi.name}".
            </p>
            <p className={styles.modalDefaultContentText}>
              After deployment the dapplet will be owned by this account -
              <span className={styles.modalLabelAccount}> {currentAccount}</span>
            </p>
            <br />
            <p className={styles.modalDefaultContentText}>
              A dapplet’s ownership is represented through an NFT.
            </p>
            <p className={styles.modalDefaultContentText}>
              When the dapplet is made this NFT will automatically be created and sent to this
              account
              <span className={styles.modalLabelAccount}>
                {currentAccount}
              </span>
              .
            </p>
            <p className={styles.modalDefaultContentText}>
              You can change the dapplet owner by transferring this NFT or by selling it at a
              marketplace.
            </p>
            <br />
            <button onClick={deployNewModule} className={styles.modalDefaultContentButton}>
              Ok
            </button>
          </div>
        }
        footer={''}
        onClose={() => onCloseNewModule()}
      />
    </>
  )
}
