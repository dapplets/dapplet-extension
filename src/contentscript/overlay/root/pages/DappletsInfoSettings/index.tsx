import React, { ReactElement, useState, useEffect, useMemo, FC } from 'react'
import cn from 'classnames'
import styles from './DappletsInfoSettings.module.scss'
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

export interface DappletsInfoSettings {
  isDappletsDetails: boolean
  setDappletsDetail: (x) => void
  ModuleInfo: any
  ModuleVersion: any
}
let _isMounted = false

export const DappletsInfoSettings: FC<DappletsInfoSettings> = (props) => {
  const { isDappletsDetails, setDappletsDetail, ModuleInfo, ModuleVersion } =
    props

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

  const _addContextId = async (contextId: string) => {
    setEditContextIdLoading(true)

    const { addContextId } = await initBGFunctions(browser)
    await addContextId(targetRegistry, mi.name, contextId)
    setEditContextIdLoading(false)
    setEditContextIdDone(true)
  }
  const saveChanges = async () => {
    try {
      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(targetRegistry, targetStorages, mi)

      setOriginalMi(JSON.parse(JSON.stringify(mi)))
      setDappletsDetail(false)
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainInfoBlock}>
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
                      onBlur={() => {
                        _addContextId(editContextId)
                      }}
                    />

                    <button
                      onClick={onDeleteChildContext.bind(null, i)}
                      className={styles.contextDelete}
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
          onClick={() => setDappletsDetail(false)}
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
