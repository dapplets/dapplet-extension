import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import TopologicalSort from 'topological-sort'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { StorageRef } from '../../../../../background/registries/registry'
import { DEFAULT_BRANCH_NAME, StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { Modal } from '../Modal'
import styles from './DevModulesList.module.scss'

enum DeploymentStatus {
  Unknown,
  Deployed,
  NotDeployed,
  NewModule,
}
interface PropsStorageRefImage {
  storageRef: StorageRef | string
  className?: string
  onClick?: (x) => void
  title?: string
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

export const StorageRefImage: FC<PropsStorageRefImage> = (props) => {
  const { storageRef, className, title, onClick } = props
  const [dataUri, setDataUri] = useState(null)

  useEffect(() => {
    const init = async () => {
      if (!storageRef) return

      if (typeof storageRef === 'string') {
        setDataUri(storageRef)
      } else {
        const { hash, uris } = storageRef

        if (!hash && uris.length > 0 && uris[0].indexOf('data:') === 0) {
          setDataUri(uris[0])
        } else {
          const { getResource } = await initBGFunctions(browser)

          if (
            storageRef.hash !==
              '0x0000000000000000000000000000000000000000000000000000000000000000' ||
            storageRef.uris.length !== 0
          ) {
            const base64 = await getResource(storageRef)
            const dataUri = 'data:text/plain;base64,' + base64
            setDataUri(dataUri)
          } else {
            setDataUri(null)
          }
        }
      }
    }
    init()
    return () => {}
  }, [storageRef])
  return (
    <div className={cn(styles.dappletsImg, className)} onClick={onClick}>
      {dataUri ? <img src={dataUri} /> : <span className={styles.noLogo} />}
    </div>
  )
}
interface PropsDeveloper {
  setDappletsDetail: (x) => void
  modules: {
    module: ModuleInfo
    versions: VersionInfo[]
    isDeployed: boolean[]
  }[]
  onDetailsClick: (x: any, y: any) => void
  setModuleInfo: (x) => void
  setModuleVersion: (x) => void

  setUnderConstructionDetails: (x) => void
  isLocalhost?: boolean
  setUpdate?: (x) => void

  isLoadingDeploy?: boolean
  setLoadingDeploy?: () => void
  setLoadingDeployFinally?: () => void
}
let isMounted = false
export const DevModule: FC<PropsDeveloper> = (props) => {
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
  } = props

  const nodes = new Map<string, any>()
  const [originalMi, setOriginalMi] = useState<ModuleInfo>(null)
  const [mi, setMi] = useState<ModuleInfo>(modules[0].module)
  const [vi, setVi] = useState<VersionInfo>(modules[0].versions[0])
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [currentAccount, setCurrentAccount] = useState(null)
  const [trustedUsers, setTrustedUsers] = useState([])
  const [mode, setMode] = useState<FormMode>(null)
  const [targetStorages, setTargetStorages] = useState([
    StorageTypes.Swarm,
    StorageTypes.Sia,
    StorageTypes.Ipfs,
  ])
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  const [registryOptions, setRegistryOptions] = useState([])
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [deploymentStatus, setDeploymentStatus] = useState(DeploymentStatus.Unknown)
  const [owner, setOwner] = useState(null)
  const [dependenciesChecking, setDpendenciesChecking] = useState<DependencyChecking[]>([])
  const nodeButton = useRef<HTMLButtonElement>()
  const [textButtonDeploy, setTextButtonDeploy] = useState('Deploy')

  const [messageError, setMessageError] = useState(null)
  const [isModalError, setModalError] = useState(false)
  const onCloseError = () => setModalError(false)
  const [isNotAccountModal, setNotAccountModal] = useState(false)
  // const _isMounted = useRef(true)
  useEffect(() => {
    isMounted = true
    const init = async () => {
      await _updateData()
      isLoadingDeploy ? setTextButtonDeploy('') : setTextButtonDeploy('Deploy')
    }
    init()
    return () => {
      isMounted = false
    }
  }, [targetChain, currentAccount, modules[0], isLoadingDeploy, isModalError])

  modules.forEach((x) => {
    nodes.set(x.versions[0] ? x.module.name + '#' + x.versions[0]?.branch : x.module.name, x)
  })
  const sorting = new TopologicalSort(nodes)
  // modules.forEach((x) => {
  //   const deps = [
  //     ...Object.keys(x.versions[0]?.dependencies || {}),
  //     ...Object.keys(x.versions[0]?.interfaces || {}),
  //   ]
  //   deps.forEach((d) => {
  //     if (nodes.has(d + '#' + DEFAULT_BRANCH_NAME)) {
  //       sorting.addEdge(d + '#' + DEFAULT_BRANCH_NAME, x.module.name + '#' + x.versions[0]?.branch)
  //     }
  //   })
  // })

  const sorted = [...sorting.sort().values()].map((x) => x.node)

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
    const { getSwarmGateway } = await initBGFunctions(browser)
    const swarmGatewayUrl = await getSwarmGateway()

    if (mi === null && vi === null) {
      const mi = new ModuleInfo()
      setOriginalMi(JSON.parse(JSON.stringify(mi)))
      setMi(mi)
      setSwarmGatewayUrl(swarmGatewayUrl)
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
      setOriginalMi(JSON.parse(JSON.stringify(mi)))
      setMi(mi)
      setVi(vi)
      setSwarmGatewayUrl(swarmGatewayUrl)
      setDpendenciesChecking(dependenciesChecking)
      setTargetStorages(
        Object.keys(vi?.overlays ?? {}).length > 0
          ? [StorageTypes.Swarm, StorageTypes.Sia]
          : [StorageTypes.Swarm, StorageTypes.Sia, StorageTypes.Ipfs]
      )
      setMode(FormMode.Deploying)
    }
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
    } else {
      return Promise.all([
        _updateOwnership(),
        _updateCurrentAccount(),
        _updateDeploymentStatus(),
        _checkDependencies(),
      ])
      // await _updateOwnership(),
      //   await _updateCurrentAccount(),
      //   await _updateDeploymentStatus(),
      //   await _checkDependencies()
    }
  }
  const _updateOwnership = async () => {
    if (targetRegistry && mi.name) {
      const { getOwnership } = await initBGFunctions(browser)

      const owner = await getOwnership(targetRegistry, mi.name)

      setOwner(owner)
    } else {
      return
    }
  }
  const _updateDeploymentStatus = async () => {
    setDeploymentStatus(DeploymentStatus.Unknown)
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
    setDeploymentStatus(deploymentStatus)
  }
  const _updateCurrentAccount = async () => {
    if (targetChain) {
      const { getOwnership, getAddress } = await initBGFunctions(browser)
      const currentAccount = await getAddress(DefaultSigners.EXTENSION, targetChain)
      setCurrentAccount(currentAccount)
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

    // e.target.classList.add(styles.dappletsIsLoadingDeploy)
    const isNotNullCurrentAccount = !(
      !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
    )
    const isNotTrustedUser =
      isNotNullCurrentAccount &&
      !trustedUsers.find((x) => x.account.toLowerCase() === currentAccount.toLowerCase())
    if (isNotTrustedUser) {
      await addTrustedUser(currentAccount.toLowerCase())
    }
    if (!isNotNullCurrentAccount) {
      setNotAccountModal(true)
    } else {
      try {
        setLoadingDeploy()
        setTextButtonDeploy('')

        mode === FormMode.Creating
          ? await deployModule(mi, null, targetStorages, targetRegistry)
          : await deployModule(mi, vi, targetStorages, targetRegistry)

        setDeploymentStatus(DeploymentStatus.Deployed)

        setTextButtonDeploy('Deploy')
        setUpdate(true)
      } catch (err) {
        console.log(err)

        setMessageError({
          type: 'negative',
          header: 'Publication error',
          message: [err.message],
        })
        setModalError(true)
        setNotAccountModal(false)

        setTextButtonDeploy('Deploy')
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
    } finally {
      window.close()
    }
  }

  return (
    <>
      {sorted.map((m, i) => (
        <div id={String(i)} className={styles.dappletsBlock} key={i}>
          <StorageRefImage storageRef={m.module.icon} />

          <div className={styles.dappletsInfo}>
            <div className={styles.dappletsTegs}>
              {m.versions && m.versions[0] && m.versions[0].version ? (
                <div className={styles.dappletsVersion}>{m.versions[0].version}</div>
              ) : (
                <div className={styles.dappletsVersionUC}>Under Construction</div>
              )}

              {m.versions &&
                m.versions[0] &&
                m.versions[0].branch &&
                m.versions[0].branch !== 'default' && (
                  <div style={{ margin: '0 3px 0 0px' }} className={styles.dappletsBranch}>
                    {m.versions[0].branch}
                  </div>
                )}
              {m.isDeployed?.[0] === false && (
                <div className={styles.dappletsNotDeploy}>not deployed</div>
              )}
            </div>

            <div className={styles.blockInfo}>
              <h3 className={styles.dappletsTitle}>{m.module.title}</h3>
              {m.module.isUnderConstruction ? (
                <span
                  onClick={() => {
                    onDetailsClick(m.module, m.versions[0])

                    setUnderConstructionDetails(true)
                    setModuleInfo(m.module)
                    setModuleVersion(m.versions[0])
                  }}
                  className={styles.dappletsSettingsIsUnderConstructionBlock}
                >
                  <button className={styles.dappletsSettingsIsUnderConstruction} />
                  <span className={styles.dappletsSettingsIsTocenomics} />
                </span>
              ) : (
                <button
                  className={cn(styles.dappletsSettings, {
                    [styles.dappletsSettingsRegistry]: m.module.author !== null,
                    [styles.noneVisible]: isLocalhost,
                  })}
                  onClick={() => {
                    // TODO: DELETE J add contextID
                    m.module.contextIds = []
                    onDetailsClick(m.module, m.versions[0])
                    setDappletsDetail(true)

                    setModuleInfo(m.module)
                    setModuleVersion(m.versions[0])
                  }}
                />
              )}
              {m.module.isUnderConstruction || !isLocalhost ? null : (
                <button
                  id={String(i)}
                  ref={nodeButton}
                  disabled={isLoadingDeploy}
                  onClick={(e) => {
                    m.isDeployed?.[0] === false && deployButtonClickHandler(e)
                  }}
                  className={cn(styles.dappletsReupload, {
                    [styles.dapDeploy]: m.isDeployed?.[0] !== false,
                    [styles.dappletsIsLoadingDeploy]: isLoadingDeploy,
                  })}
                >
                  {textButtonDeploy}
                </button>
              )}
            </div>
            <div className={styles.dappletsLabel}>
              {m.module.name && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Name:</span>
                  <label className={cn(styles.dappletsLabelSpan, styles.dappletsLabelSpanInfo)}>
                    {m.module.name}
                  </label>
                </div>
              )}

              {m.module.author && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Owner:</span>
                  <label className={cn(styles.dappletsLabelSpan, styles.dappletsLabelSpanInfo)}>
                    {visible(` ${m.module.author}`)}
                  </label>
                </div>
              )}

              <div>
                <span className={styles.dappletsLabelSpan}>Type:</span>
                <label className={cn(styles.dappletsLabelSpan, styles.dappletsLabelSpanInfo)}>
                  {m.module.type}
                </label>
              </div>
            </div>
          </div>
        </div>
      ))}
      {isNotAccountModal ? (
        owner ? (
          <Modal
            visible={isNotAccountModal}
            title={'The wrong wallet'}
            classNameContent={styles.isNotAccountModalOwner}
            content={
              <div className={styles.modalDefaultContent}>
                <p style={{ overflowWrap: 'break-word' }}>Change account to {owner}</p>

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
          content={
            <div className={styles.modalDefaultContent}>
              {messageError.message.map((m, i) => (
                <p key={i} style={{ overflowWrap: 'break-word' }}>
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
    </>
  )
}
