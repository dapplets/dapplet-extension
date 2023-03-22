import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'

import { Modal } from '../../components/Modal'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import { StorageRefImage } from '../../components/StorageRefImage'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
import styles from './UnderConstructionInfo.module.scss'
import './valid.scss'

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

export interface UnderConstructionInfoProps {
  ModuleInfo: any
  ModuleVersion: any
  setUnderConstructionDetails: (x) => void
  setShowChildrenUnderConstraction: (x) => void
}

export const UnderConstructionInfo: FC<UnderConstructionInfoProps> = (props) => {
  const {
    setUnderConstructionDetails,
    ModuleInfo,
    ModuleVersion,
    setShowChildrenUnderConstraction,
  } = props

  const [originalMi, setOriginalMi] = useState(null)
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [vi, setVi] = useState<VersionInfo>(ModuleVersion)
  const [dependenciesChecking, setDpendenciesChecking] = useState<DependencyChecking[]>()
  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [message, setMessage] = useState(null)
  const [registryOptions, setRegistryOptions] = useState([])
  const [owner, setOwner] = useState(null)
  const [currentAccount, setCurrentAccount] = useState(null)

  const [editContextId, setEditContextId] = useState('')
  const [editContextIdLoading, setEditContextIdLoading] = useState(false)
  const [editContextIdDone, setEditContextIdDone] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState(DeploymentStatus.Unknown)
  const [trustedUsers, setTrustedUsers] = useState([])

  const [mode, setMode] = useState(null)

  const [targetStorages, setTargetStorages] = useState([StorageTypes.Swarm, StorageTypes.Ipfs])

  const [author, setAuthor] = useState({ authorForm: [] })

  const newAuthorObject = {
    author: 'New admins',
  }
  const fileInput = useRef<HTMLInputElement>()
  const [st, setSt] = useState([])

  const [isDisabledPush, setDisabledPush] = useState(true)
  const [isModal, setModal] = useState(false)
  const onClose = () => setModal(false)
  const [autorDisabled, setAuthorDisabled] = useState(false)
  const [isModalPush, setModalPush] = useState(false)

  const [isModalTransaction, setModalTransaction] = useState(false)

  const [isNotAccountModal, setNotAccountModal] = useState(false)
  const [isLoad, setLoad] = useState(false)
  const [visible, setVisible] = useState(false)
  const node = useRef<HTMLButtonElement>()
  const nodeInput = useRef<HTMLInputElement>()
  const [visibleContextId, setVisibleContextId] = useState([])
  const [contextDeleteNone, setContextDeleteNone] = useState(false)
  const [addDisabled, setAddDisabled] = useState(false)
  const abortController = useAbortController()

  useEffect(() => {
    const init = async () => {
      setLoad(true)
      await _updateData()
      setLoad(false)
      if (!isNotNullCurrentAccount) {
        setNotAccountModal(true)
      } else {
        setNotAccountModal(false)
      }
    }
    init()
    // if (author.authorForm.length === 0) {

    //   setAuthorDisabled(false)

    // }
    return () => {
      abortController.abort()
    }
  }, [abortController.signal.aborted])
  const addButtonClickHandler = () => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.push(newAuthorObject)
    setAuthor(newAuthor)
  }

  const onDeleteChild = (id: number) => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.splice(id, 1)
    setAuthor(newAuthor)
  }

  const _updateData = async () => {
    const { getRegistries, getTrustedUsers, getContextIds } = await initBGFunctions(browser)

    const registries = await getRegistries()
    const trustedUsers = await getTrustedUsers()
    const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)
    const contextId = await getContextIds(prodRegistries[0]?.url, mi.name)
    setRegistryOptions(
      prodRegistries.map((r) => ({
        key: r.url,
        text: r.url,
        value: r.url,
      }))
    )

    setVisibleContextId(contextId)
    contextId.length && setVisible(true)
    setTargetRegistry(prodRegistries[0]?.url || null)
    setTrustedUsers(trustedUsers)
    setTargetChain(chainByUri(typeOfUri(prodRegistries[0]?.url ?? '')))

    await _updateCurrentAccount()
  }

  const _updateCurrentAccount = async () => {
    const { getOwnership, getAddress } = await initBGFunctions(browser)
    if (targetChain) {
      const currentAccount = await getAddress(DefaultSigners.EXTENSION, targetChain)

      setCurrentAccount(currentAccount)
    } else return
  }

  const iconInputChangeHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setModalTransaction(true)
    try {
      const { editModuleInfo } = await initBGFunctions(browser)
      await editModuleInfo(targetRegistry, targetStorages, mi)

      setOriginalMi(JSON.parse(JSON.stringify(mi)))

      setModalTransaction(false)
      setModalPush(true)
    } catch (err) {
      setMessage({
        type: 'negative',
        header: 'Publication error',
        message: [err.message],
      })
      setModalTransaction(false)
      setModal(true)
    } finally {
    }
  }

  const newContextObject = ''
  const addButtonClickHandlerContext = () => {
    const newContext = Object.assign({}, mi)
    newContext.contextIds.push(newContextObject)
    setMi(newContext)
  }

  const onDeleteChildContext = (id: number) => {
    const newContext = Object.assign({}, mi)
    newContext.contextIds.splice(id, 1)
    setMi(newContext)
  }

  const _addContextId = async (contextId: string) => {
    setEditContextIdLoading(true)
    setAddDisabled(true)

    try {
      const { addContextId, getContextIds } = await initBGFunctions(browser)
      if (!targetRegistry || !mi.name || !contextId) return

      await addContextId(targetRegistry, mi.name, contextId)
      const contextIds = await getContextIds(targetRegistry, mi.name)

      setVisibleContextId(contextIds)
      setVisible(true)
    } catch (error) {
      setVisible(false)
    } finally {
      setEditContextIdDone(true)
      setEditContextIdLoading(false)
      setAddDisabled(false)
      node.current?.classList.remove('valid')
      setEditContextId('')
    }
  }

  // const isNotNullCurrentAccount = !(
  //   !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
  // )
  const isNotNullCurrentAccount = true

  const onChange = (e) => {
    const files = e.target.files

    const filesArr = Array.prototype.slice.call(files)

    setSt([...filesArr])
  }
  const visibleNameFile = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 6)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  return (
    <div className={styles.wrapper}>
      {message ? (
        <Modal
          classNameWrapper={styles.messageModalDefault}
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
              <button onClick={() => onClose()} className={styles.modalDefaultContentButton}>
                OK
              </button>
            </div>
          }
          footer={''}
          onClose={() => onClose()}
        />
      ) : null}
      {!isNotNullCurrentAccount && !loading ? (
        owner ? (
          <Modal
            classNameWrapper={styles.messageModalDefault}
            visible={isNotAccountModal}
            title={'The wrong wallet'}
            content={
              <div className={styles.modalDefaultContent}>
                <p>Change account to {owner}</p>

                <br />
                <p> Connect a new wallet</p>
              </div>
            }
            footer={''}
            onClose={() => setNotAccountModal(false)}
          />
        ) : (
          <Modal
            classNameWrapper={styles.messageModalDefault}
            visible={isNotAccountModal}
            title={'Wallet is not connected'}
            content={
              <div className={styles.modalDefaultContent}>
                You can not deploy a module without a wallet. Connect a new wallet
              </div>
            }
            footer={''}
            onClose={() => setNotAccountModal(false)}
          />
        )
      ) : null}
      {isLoad ? (
        <TabLoader />
      ) : (
        <>
          <div className={styles.mainInfoBlock}>
            <SettingWrapper
              className={styles.wrapperSettings}
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
                        value={mi.title ?? ''}
                        onChange={(e) => {
                          setMi({ ...mi, title: e.target.value })

                          setDisabledPush(false)
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
                        value={mi.description ?? ''}
                        onChange={(e) => {
                          setMi({ ...mi, description: e.target.value })

                          setDisabledPush(false)
                        }}
                      />
                    }
                  />
                  {/* <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={<textarea className={styles.fullDescription} />}
              /> */}

                  <div className={styles.iconBlock}>
                    <div className={styles.imgBlock}>
                      <StorageRefImage className={styles.img} storageRef={mi.icon} />

                      {st.map((x, i) => (
                        <span className={styles.imgTitle} key={i}>
                          {visibleNameFile(x.name)}
                        </span>
                      ))}
                    </div>

                    <div className={styles.buttonIcon}>
                      <input
                        ref={fileInput}
                        type="file"
                        name="file"
                        id="file"
                        accept=".png"
                        className={styles.inputfile}
                        onChange={(e) => {
                          onChange(e)
                          iconInputChangeHandler(e)

                          setDisabledPush(false)
                        }}
                      />
                      <label htmlFor="file">Change icon</label>
                    </div>
                  </div>
                </div>
              }
            />
            {/* <SettingWrapper
          title="Team"
          className={styles.wrapperSettings}
          children={
            <div className={styles.ownershipBlock}>
              <div className={styles.wrapperAdmins}>
                <div className={styles.blockAdmins}>
                  <h3 className={styles.adminsTitle}>Admins</h3>
                  <button
                    disabled={autorDisabled}
                    onClick={() => {
                      addButtonClickHandler()
                      setAuthorDisabled(true)
                    }}
                    className={cn(styles.adminsButton, {
                      [styles.adminsButtonDisabled]: autorDisabled,
                    })}
                  />
                </div>
                {author.authorForm.map((x, i) => (
                  <div key={i} className={styles.blockAuthors}>
                    <input
                      key={i}
                      className={styles.authorTitle}
                      placeholder={x.author}
                      onChange={(e) => {
                        author.authorForm[i].author = e.target.value
                        if (e.target.value.length !== 0) {
                          setAuthorDisabled(false)
                        }
                        setDisabledPush(false)
                      }}
                    />
                    <button onClick={onDeleteChild.bind(null, i)} className={styles.authorDelete} />
                  </div>
                ))}
              </div>
            </div>
          }
        /> */}
            <SettingWrapper
              title="Parameters"
              className={styles.wrapperSettings}
              children={
                <div className={styles.parametersBlock}>
                  <div className={styles.wrapperContextID}>
                    <div className={styles.blockContextID}>
                      <h3 className={styles.blockContextIDTitle}>Context IDs</h3>
                      <button
                        disabled={mi.contextIds.length >= 1}
                        onClick={addButtonClickHandlerContext}
                        className={cn(styles.contextIDButton, {
                          [styles.contextIDButtonDisabled]: mi.contextIds.length >= 1,
                        })}
                      />
                    </div>
                    {mi.contextIds.map((x, i) => (
                      <div key={i} className={styles.wrapperContext}>
                        <div className={styles.blockContext}>
                          <input
                            key={i}
                            ref={nodeInput}
                            className={styles.blockContextTitle}
                            value={editContextId}
                            placeholder={'Context ID (ex: example.com)'}
                            onChange={(e) => {
                              setEditContextId(e.target.value)
                            }}
                          />

                          <button
                            ref={node}
                            onClick={() => {
                              onDeleteChildContext(i)
                              setEditContextId('')
                            }}
                            className={cn(styles.contextDelete, {
                              [styles.contextDeleteNone]: contextDeleteNone,
                            })}
                          />
                        </div>
                        <button
                          disabled={nodeInput.current?.value.length < 2 || addDisabled}
                          onClick={() => {
                            node.current?.classList.add('valid')
                            _addContextId(editContextId)
                          }}
                          className={cn(styles.addContext, {
                            [styles.addContextDisabled]:
                              nodeInput.current?.value.length < 2 || addDisabled,
                          })}
                        >
                          ADD
                        </button>
                      </div>
                    ))}
                    {editContextIdLoading ? (
                      <div className={styles.editContextIdLoading}></div>
                    ) : (
                      <>
                        {visible &&
                          visibleContextId &&
                          visibleContextId.length &&
                          visibleContextId.map((x, i) => (
                            <input
                              key={i}
                              className={styles.blockContext}
                              placeholder={x}
                              value={x}
                              readOnly
                            />
                          ))}
                      </>
                    )}
                  </div>
                </div>
              }
            />
          </div>
          <div className={styles.linkNavigation}>
            <button
              onClick={() => {
                setUnderConstructionDetails(false)
                setShowChildrenUnderConstraction(true)
              }}
              className={styles.back}
            >
              Back
            </button>
            <button
              disabled={isDisabledPush || !isNotNullCurrentAccount}
              onClick={() => {
                saveChanges()
              }}
              className={cn(styles.push, {
                [styles.pushDisabled]: isDisabledPush || !isNotNullCurrentAccount,
              })}
            >
              Push changes
            </button>
          </div>
        </>
      )}

      <Modal
        classNameWrapper={styles.modalDialog}
        visible={isModalPush}
        title="Сhanges were accepted"
        content={
          <div className={styles.modalDefaultContent}>
            Your dapplet has been updated
            <button
              onClick={() => {
                setUnderConstructionDetails(false)
                setShowChildrenUnderConstraction(true)
              }}
              className={styles.modalDefaultContentButton}
            >
              OK
            </button>
          </div>
        }
        footer={''}
        onClose={() => {
          setUnderConstructionDetails(false)
          setShowChildrenUnderConstraction(true)
        }}
      />
      <Modal
        classNameWrapper={styles.newModalTransaction}
        visible={isModalTransaction}
        title="Confirming Transaction"
        content={<div className={styles.modalDefaultContent}></div>}
        footer={''}
        onClose={() => {
          setModalTransaction(false)
        }}
      />
    </div>
  )
}
