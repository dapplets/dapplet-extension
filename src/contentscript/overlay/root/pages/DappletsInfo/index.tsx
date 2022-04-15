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
}

export const DappletsMainInfo: FC<DappletsMainInfoProps> = (props) => {
  const { isDappletsDetails, setDappletsDetail } = props
  const bus = new Bus()
  const transferOwnershipModal = React.createRef<any>()
  const addContextIdModal = React.createRef<any>()
  const fileInputRef = React.createRef<HTMLInputElement>()
  const [originalMi, setOriginalMi] = useState(null)
  const [mi, setMi] = useState(null)
  const [vi, setVi] = useState(null)
  const [dependenciesChecking, setDpendenciesChecking] = useState([])
  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState(null)
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
  // targetChain: null,
  // targetStorages: [
  //     StorageTypes.Swarm,
  //     StorageTypes.Sia,
  //     StorageTypes.Ipfs
  // ],

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainInfoBlock}>
        <SettingWrapper
          title="Social"
          children={
            <div className={styles.socialBlock}>
              <div className={styles.moduleTitle}></div>
              <SettingItem
                title="Title"
                className={styles.item}
                component={<></>}
                children={<input className={styles.inputTitle} />}
              />
              <SettingItem
                title="Description"
                component={<></>}
                className={styles.item}
                children={<input className={styles.inputTitle} />}
              />
              <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={<textarea className={styles.fullDescription} />}
              />

              <div className={styles.iconBlock}>
                <div className={styles.imgBlock}>
                  <img className={styles.img} />
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
                    <button className={styles.ownershipButton}>Shange</button>
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
