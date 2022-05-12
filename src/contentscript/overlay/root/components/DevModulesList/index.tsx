import React, { useState, useEffect, FC, useRef, useMemo } from 'react'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'

import { StorageRef } from '../../../../../background/registries/registry'

import { DEFAULT_BRANCH_NAME } from '../../../../../common/constants'
import TopologicalSort from 'topological-sort'
import styles from './DevModulesList.module.scss'
import cn from 'classnames'
import { initBGFunctions } from 'chrome-extension-message-wrapper'

import { browser } from 'webextension-polyfill-ts'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { ModuleTypes, StorageTypes } from '../../../../../common/constants'
import { typeOfUri, chainByUri, joinUrls } from '../../../../../common/helpers'
import { Modal } from '../Modal'
import { xhrCallback } from '@sentry/tracing/types/browser/request'
let _isMounted = true
enum DeploymentStatus {
  Unknown,
  Deployed,
  NotDeployed,
  NewModule,
}
interface PropsStorageRefImage {
  storageRef: StorageRef
  className?: string
  onClick?: (x) => void
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
  const { storageRef, className } = props
  const [dataUri, setDataUri] = useState(null)
  useEffect(() => {
    _isMounted = true

    const init = async () => {
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
    init()
    return () => {
      _isMounted = false
    }
  }, [storageRef])
  return (
    <div className={cn(styles.dappletsImg, className)}>
      {dataUri ? <img src={dataUri} /> : <span className={styles.noLogo} />}
    </div>
  )
}
interface PropsDeveloper {
  isDappletsDetails: boolean
  setDappletsDetail: (x) => void
  modules: {
    module: ModuleInfo
    versions: VersionInfo[]
    isDeployed: boolean[]
  }[]
  onDetailsClick: (x: any, y: any) => void
  setModuleInfo: (x) => void
  setModuleVersion: (x) => void
  isUnderConstructionDetails: boolean
  setUnderConstructionDetails: (x) => void
}
export const DevModule: FC<PropsDeveloper> = (props) => {
  const {
    modules,
    onDetailsClick,
    isDappletsDetails,
    setDappletsDetail,
    setModuleInfo,
    setModuleVersion,
    isUnderConstructionDetails,
    setUnderConstructionDetails,
  } = props

  const nodes = new Map<string, any>()
  const [mi, setMi] = useState<ModuleInfo>(modules[0].module)
  const [vi, setVi] = useState<VersionInfo>(modules[0].versions[0])
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [currentAccount, setCurrentAccount] = useState(null)
  const [trustedUsers, setTrustedUsers] = useState([])
  const [mode, setMode] = useState(FormMode.Deploying)
  const [targetStorages, setTargetStorages] = useState([
    StorageTypes.Swarm,
    StorageTypes.Sia,
    StorageTypes.Ipfs,
  ])
  const [registryOptions, setRegistryOptions] = useState([])
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [deploymentStatus, setDeploymentStatus] = useState(
    DeploymentStatus.Unknown
  )
  const [owner, setOwner] = useState(null)
  const [dependenciesChecking, setDpendenciesChecking] = useState<
    DependencyChecking[]
  >([])
  const nodeButton = useRef<HTMLButtonElement>()
  const [textButtonDeploy, setTextButtonDeploy] = useState('Deploy')
  const [textButtonReupload, setTextButtonReupload] = useState('Reapload')
  const [isLoadingDeploy, setLoadingDeploy] = useState(false)
  const [messageError, setMessageError] = useState(null)
  const [isModalError, setModalError] = useState(false)
  const onCloseError = () => setModalError(false)

  modules.forEach((x) => {
    nodes.set(
      x.versions[0]
        ? x.module.name + '#' + x.versions[0]?.branch
        : x.module.name,
      x
    )
  })
  const sorting = new TopologicalSort(nodes)
  modules.forEach((x) => {
    const deps = [
      ...Object.keys(x.versions[0]?.dependencies || {}),
      ...Object.keys(x.versions[0]?.interfaces || {}),
    ]
    deps.forEach((d) => {
      if (nodes.has(d + '#' + DEFAULT_BRANCH_NAME)) {
        sorting.addEdge(
          d + '#' + DEFAULT_BRANCH_NAME,
          x.module.name + '#' + x.versions[0]?.branch
        )
      }
    })
  })
  const sorted = [...sorting.sort().values()].map((x) => x.node)

  const visible = (hash: string): string => {
    if (hash.length > 28) {
      const firstFourCharacters = hash.substring(0, 14)
      const lastFourCharacters = hash.substring(
        hash.length - 0,
        hash.length - 14
      )

      return `${firstFourCharacters}...${lastFourCharacters}`
    } else {
      return hash
    }
  }

  useEffect(() => {
    _isMounted = true
    // loadSwarmGateway()

    const init = async () => {
      await _updateData()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [targetChain, currentAccount, isLoadingDeploy, modules[0]])

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
    } else {
      return Promise.all([
        _updateOwnership(),
        _updateCurrentAccount(),
        _updateDeploymentStatus(),
        _checkDependencies(),
      ])
    }
  }
  const _updateOwnership = async () => {
    const { getOwnership } = await initBGFunctions(browser)
    const owner = await getOwnership(targetRegistry)

    setOwner(owner)
  }
  const _updateDeploymentStatus = async () => {
    setDeploymentStatus(DeploymentStatus.Unknown)

    const { getVersionInfo, getModuleInfoByName } = await initBGFunctions(
      browser
    )
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
    const { getOwnership, getAddress } = await initBGFunctions(browser)
    const currentAccount = await getAddress(
      DefaultSigners.EXTENSION,
      targetChain
    )
    setCurrentAccount(currentAccount)
  }
  const _checkDependencies = async () => {
    const { getVersionInfo } = await initBGFunctions(browser)

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

  const deployButtonClickHandler = async (vi, e) => {
    const { deployModule, addTrustedUser } = await initBGFunctions(browser)

    mi.registryUrl = targetRegistry
    mi.author = currentAccount

    setLoadingDeploy(true)

    e.target.classList.add(styles.dappletsIsLoadingDeploy)
    setTextButtonDeploy('Deploing...')
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

      setDeploymentStatus(DeploymentStatus.Deployed)

      e.target.classList.remove(styles.dappletsIsLoadingDeploy)
      setTextButtonDeploy('Reapload')
    } catch (err) {
      setMessageError({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
      setModalError(true)
      e.target.classList.remove(styles.dappletsIsLoadingDeploy)
      setTextButtonDeploy('Deploy')
    } finally {
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
                <div className={styles.dappletsVersion}>
                  {m.versions[0].version}
                </div>
              ) : null}

              {m.versions &&
                m.versions[0] &&
                m.versions[0].branch &&
                m.versions[0].branch !== 'default' && (
                  <div
                    style={{ margin: '0 3px 0 0px' }}
                    className={styles.dappletsBranch}
                  >
                    {m.versions[0].branch}
                  </div>
                )}
              {m.isDeployed?.[0] === false && (
                <div className={styles.dappletsNotDeploy}>not deployed</div>
              )}
            </div>

            <div className={styles.blockInfo}>
              <h3
                onClick={() => {
                  console.log(m.module)
                  console.log(m.versions[0])
                }}
                className={styles.dappletsTitle}
              >
                {m.module.title}
              </h3>
              {m.module.isUnderConstruction ? (
                <span
                  className={styles.dappletsSettingsIsUnderConstructionBlock}
                >
                  <button
                    className={styles.dappletsSettingsIsUnderConstruction}
                    onClick={() => {
                      onDetailsClick(m.module, m.versions[0])
                      setDappletsDetail(false)
                      setUnderConstructionDetails(true)
                      setModuleInfo(m.module)
                      setModuleVersion(m.versions[0])
                    }}
                  />
                  <span className={styles.dappletsSettingsIsTocenomics} />
                </span>
              ) : (
                <button
                  className={styles.dappletsSettings}
                  onClick={() => {
                    onDetailsClick(m.module, m.versions[0])
                    setDappletsDetail(true)
                    setModuleInfo(m.module)
                    setModuleVersion(m.versions[0])
                  }}
                />
              )}
              {m.module.isUnderConstruction ? (
                <button
                  className={cn(
                    styles.dappletsReuploadisUnderConstructionPublish,
                    {
                      [styles.dappletsReuploadisUnderConstructionDeploy]:
                        m.isDeployed?.[0] === false,
                    }
                  )}
                >
                  {m.isDeployed?.[0] === false ? 'Deploy' : 'Publish'}
                </button>
              ) : (
                <button
                  id={String(i)}
                  ref={nodeButton}
                  onClick={(e) => {
                    m.isDeployed?.[0] === false &&
                      deployButtonClickHandler(m.versions[0], e)
                  }}
                  className={cn(styles.dappletsReupload, {})}
                >
                  {m.isDeployed?.[0] === false
                    ? textButtonDeploy
                    : textButtonReupload}
                </button>
              )}
            </div>
            <div className={styles.dappletsLabel}>
              {m.module.name && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Name:</span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {m.module.name}
                  </label>
                </div>
              )}

              {m.module.author && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Ownership:</span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {visible(` ${m.module.author}`)}
                  </label>
                </div>
              )}
              {m.module.registryUrl && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Registry:</span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {visible(`${m.module.registryUrl}`)}
                  </label>
                </div>
              )}
              {m.versions && m.versions[0] && m.versions[0].version && (
                <div>
                  <span className={styles.dappletsLabelSpan}>
                    Version in registry:
                  </span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {m.versions[0].version}
                  </label>
                </div>
              )}
              <div>
                <span className={styles.dappletsLabelSpan}>Type:</span>
                <label
                  className={cn(
                    styles.dappletsLabelSpan,
                    styles.dappletsLabelSpanInfo
                  )}
                >
                  {m.module.type}
                </label>
              </div>
            </div>
          </div>
        </div>
      ))}

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
              <button
                onClick={() => onCloseError()}
                className={styles.modalDefaultContentButton}
              >
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
