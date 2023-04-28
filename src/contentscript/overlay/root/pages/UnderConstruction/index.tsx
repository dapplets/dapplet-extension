import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import { ModuleTypes, StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { Modal } from '../../components/Modal'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import styles from './UnderConstruction.module.scss'
// import { RadioButton } from './RadioButton'

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
export interface variantsStake {
  time: string
  AUGE: number
}

export interface UnderConstruction {
  setUnderConstruction: (x) => void
  setUnderConstructionDetails: (x) => void
  setModuleInfo: (x) => void
  setModuleVersion: (x) => void
}

export const UnderConstruction: FC<UnderConstruction> = (props: UnderConstruction) => {
  const { setUnderConstruction, setUnderConstructionDetails, setModuleInfo, setModuleVersion } =
    props

  const [mi, setMi] = useState<ModuleInfo>(new ModuleInfo())

  const [dependenciesChecking, setDpendenciesChecking] = useState<DependencyChecking[]>([])
  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [message, setMessage] = useState<Message>(null)

  const [registryOptions, setRegistryOptions] = useState([])
  const [owner, setOwner] = useState(null)

  const [currentAccount, setCurrentAccount] = useState(null)

  const [deploymentStatus, setDeploymentStatus] = useState(DeploymentStatus.Unknown)
  const [trustedUsers, setTrustedUsers] = useState([])

  const [mode, setMode] = useState(FormMode.Creating)

  const [targetStorages, setTargetStorages] = useState([StorageTypes.Swarm, StorageTypes.Ipfs])
  const [isModal, setModal] = useState(false)
  const [inputNameError, setInputNameError] = useState(null)
  const [inputTitleError, setInputTitleError] = useState(null)
  const [inputDescriptionError, setInputDescriptionError] = useState(null)
  const [inputFullDescriptionError, setFullInputDescriptionError] = useState(null)
  const onClose = () => setModal(false)

  const [isModalCreation, setModalCreation] = useState(false)
  const onCloseModalCreation = () => setModalCreation(false)
  const [isModalEndCreation, setModalEndCreation] = useState(false)
  const [timeStateVariants, setTimeStateVariants] = useState([
    { time: '1', AUGE: null, sec: 60 * 60 * 24 * 30 },
    { time: '2', AUGE: null, sec: 60 * 60 * 24 * 30 * 2 },
    { time: '3', AUGE: null, sec: 60 * 60 * 24 * 30 * 3 },
  ])
  const [isModalTransaction, setModalTransaction] = useState(false)
  const [timeState, setTimeState] = useState(null)

  const [timeStateFull, setTimeStateFull] = useState(false)

  useEffect(() => {
    const init = async () => {
      await _updateData()
    }
    init()

    return () => {}
  }, [mi, targetChain])

  const _updateData = async () => {
    setLoading(true)
    const { getRegistries, getTrustedUsers, calcStake } = await initBGFunctions(browser)

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
    const oneMonth = await calcStake(60 * 60 * 24 * 30, prodRegistries[0]?.url || null)
    const twoMonth = await calcStake(60 * 60 * 24 * 30 * 2, prodRegistries[0]?.url || null)
    const threeMonth = await calcStake(60 * 60 * 24 * 30 * 3, prodRegistries[0]?.url || null)
    // if(!oneMonth || !twoMonth || !threeMonth)
    const newPosts = timeStateVariants.map((post) =>
      post.time === '1'
        ? { ...post, AUGE: `${oneMonth}` }
        : post.time === '2'
        ? { ...post, AUGE: `${twoMonth}` }
        : { ...post, AUGE: `${threeMonth}` }
    )
    setTimeStateVariants(newPosts)
    setTimeState({ time: '1', AUGE: oneMonth, sec: 60 * 60 * 24 * 30 })
    await _updateCurrentAccount()
  }

  const _updateCurrentAccount = async () => {
    const { getOwnership, getAddress } = await initBGFunctions(browser)
    if (targetChain) {
      const currentAccount = await getAddress(DefaultSigners.EXTENSION, targetChain)
      setCurrentAccount(currentAccount)
      setLoading(false)
    }
  }

  const deployButtonClickHandler = async () => {
    const { deployModule, addTrustedUser } = await initBGFunctions(browser)

    mi.registryUrl = targetRegistry
    mi.author = currentAccount
    mi.type = ModuleTypes.Feature

    try {
      setModalTransaction(true)
      const isNotNullCurrentAccount = !(
        !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
      )
      const isNotTrustedUser =
        isNotNullCurrentAccount &&
        !trustedUsers.find((x) => x.account.toLowerCase() === currentAccount.toLowerCase())
      if (isNotTrustedUser) {
        await addTrustedUser(currentAccount.toLowerCase())
      }
      const result =
        mode === FormMode.Creating &&
        (await deployModule(mi, null, targetStorages, targetRegistry, timeState.sec))
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
    } finally {
      setModalTransaction(false)
    }
  }

  const isNotNullCurrentAccount = !(
    !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
  )

  const isNotAnOwner =
    !!owner && isNotNullCurrentAccount && owner.toLowerCase() !== currentAccount.toLowerCase()

  const isNewModule = deploymentStatus === DeploymentStatus.NewModule

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
                You can not deploy a module without a wallet. Connect a new wallet
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
                    placeholder="Module ID like module-name.dapplet-base.eth"
                    onChange={(e) => {
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
                    placeholder="A public name of your module"
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
                      [styles.inputNameDisabled]: inputDescriptionError !== null,
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
                      [styles.inputNameDisabled]: inputFullDescriptionError !== null,
                    })}
                  />
                }
              />
              {timeState && timeState.AUGE ? (
                <div className={cn(styles.wrapperStake)}>
                  <div className={cn(styles.wrapperStakeTitle)}>Stake</div>
                  <div
                    className={cn(styles.blockStake, {
                      [styles.blockStakeFull]: timeStateFull,
                    })}
                  >
                    {!timeStateFull ? (
                      <div
                        onClick={() => setTimeStateFull(true)}
                        className={cn(styles.inputTitle, styles.inputTitleStake)}
                      >
                        <div>{timeState.time} month</div> <div>{timeState.AUGE} AUGE</div>
                      </div>
                    ) : (
                      <>
                        {timeStateVariants.map((x, i) => {
                          return (
                            <div
                              onClick={() => {
                                setTimeState({ time: x.time, AUGE: x.AUGE, sec: x.sec })
                                setTimeStateFull(false)
                              }}
                              className={cn(styles.inputTitle, styles.inputTitleStake)}
                              key={i}
                            >
                              <div>{x.time} month</div> <div>{x.AUGE} AUGE</div>
                            </div>
                          )
                        })}
                      </>
                    )}

                    {!timeStateFull && (
                      <div className={cn(styles.blockStakeDescription)}>
                        To create a DUC (and reserve a unique name for it) you will have to deposit
                        a return stake. Its size depends on the period the existence of a DUC (but
                        you can costly extend this later).
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          }
        />
      </div>

      <div className={styles.linkNavigation}>
        <button onClick={() => setUnderConstruction(false)} className={styles.back}>
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
          }
          onClick={() => {
            setModalCreation(true)
          }}
          className={cn(styles.push, {
            [styles.pushDisabled]:
              inputNameError !== null ||
              inputTitleError !== null ||
              inputDescriptionError !== null ||
              mi.name === null ||
              mi.title === null ||
              mi.description === null,
          })}
        >
          Done
        </button>
      </div>
      <Modal
        visible={isModalCreation}
        title={'DUC CREATION'}
        classNameContent={styles.modalCreationWrapper}
        content={
          <div className={styles.modalCreationContent}>
            <span className={styles.modalCreationContenTitle}>
              You create DUС. You deposit {timeState ? timeState.AUGE : null} AUGE stake by
              reserving a {mi.name} on {timeState ? timeState.time : null} months
            </span>
            If within this period you successfully replace the DUC with a working dapplet, then the
            stake is returned to you in full. If you cannot do this, then if you "burn" the DUC
            yourself, you will get the stake back minus 20% which will be "burnt". Also, any user
            will be able to, after the expiration of the existence of the DUC delete it (via
            Dapplets.Store). In this case, you will lose the steak completely.
          </div>
        }
        footer={
          <div className={styles.modalCreationContentButtonFooter}>
            <button
              className={styles.modalCreationContentButton}
              onClick={() => {
                deployButtonClickHandler()
                onCloseModalCreation()
              }}
            >
              Accept the terms
            </button>
            <button
              onClick={() => onCloseModalCreation()}
              className={styles.modalCreationContentButtonCancel}
            >
              Cancel
            </button>
          </div>
        }
        onClose={() => onCloseModalCreation()}
      />
      <Modal
        visible={isModalTransaction}
        title={'Confirming Transaction'}
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
            You have 2 months to deploy this dapplet. Otherwise, you will lose your Initial
            Steak.Also now you can add additional details, Tokenomics and Rewards to your dapplet
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
