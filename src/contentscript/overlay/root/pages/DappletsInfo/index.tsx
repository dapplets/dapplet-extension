import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import { StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { ReactComponent as Delete } from '../../assets/icons/mini-close.svg'
import { ReactComponent as Back } from '../../assets/svg/back.svg'
import { regExpIndexEthereum } from '../../common/constants'
import { Modal } from '../../components/Modal'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import { StorageRefImage } from '../../components/StorageRefImage'
import styles from './DappletsInfo.module.scss'

export interface DappletsMainInfoProps {
  setDappletsDetail: (x) => void
  ModuleInfo: any
  ModuleVersion: any
  setShowChildrenRegistry: (x) => void
}

export const DappletsMainInfo: FC<DappletsMainInfoProps> = (props) => {
  const { setDappletsDetail, ModuleInfo, ModuleVersion, setShowChildrenRegistry } = props
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [message, setMessage] = useState(null)
  const [owner, setOwner] = useState(null)
  const [currentAccount, setCurrentAccount] = useState(null)
  const [newOwner, setNewOwner] = useState('')
  const [newOwnerLoading, setNewOwnerLoading] = useState(false)
  const [editContextId, setEditContextId] = useState('')
  const [editContextIdLoading, setEditContextIdLoading] = useState(false)
  const [targetStorages, setTargetStorages] = useState<StorageTypes[]>([])
  const fileInput = useRef<HTMLInputElement>()
  const [newState, setNewState] = useState([])
  const [isDisabledPush, setDisabledPush] = useState(true)
  const [isDisabledAddOwner, setDisabledAddOwner] = useState(false)
  const [isDisabledAddAdmin, setDisabledAddAdmin] = useState(false)
  const [isModal, setModal] = useState(false)
  const [isModalPush, setModalPush] = useState(false)
  const [isModalTransaction, setModalTransaction] = useState(false)
  const [editAdmin, setEditAdmin] = useState('')
  const [admins, setAdmins] = useState(null)
  const [isNotAccountModal, setNotAccountModal] = useState(false)
  const [visibleAdmins, setVisibleAdmins] = useState(false)
  const [addDisabled, setAddDisabled] = useState(false)
  const [addAdminDisabled, setAddAdminDisabled] = useState(false)
  const [editAdminsLoading, setEditAdminsLoading] = useState(false)
  const [editAdminDone, setEditAdminDone] = useState(false)
  const [isLoad, setLoad] = useState(false)
  const node = useRef<HTMLButtonElement>()
  const nodeInput = useRef<HTMLInputElement>()
  const [visibleContextId, setVisibleContextId] = useState([])
  const nodeInputAdmin = useRef<HTMLInputElement>()
  const nodeBtnAdmin = useRef<HTMLButtonElement>()

  const onClose = () => setModal(false)

  let isNotNullCurrentAccount
  useEffect(() => {
    const init = async () => {
      setLoad(true)
      await _updateData()
      setLoad(false)
    }
    init()

    return () => {}
  }, [])

  const _updateData = async () => {
    const { getRegistries, getContextIds, getTargetStorages, getAdmins } = await initBGFunctions(
      browser
    )
    const storagesToUpload = await getTargetStorages()
    setTargetStorages(storagesToUpload) // ToDo: when Swarm will be added uplopad dapplets with overlays only to Swarm but not to Ipfs
    const registries = await getRegistries()
    const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)
    const contextId = await getContextIds(prodRegistries[0]?.url, mi.name)
    const authors = await getAdmins(prodRegistries[0]?.url, mi.name)
    setTargetRegistry(prodRegistries[0]?.url || null)
    setTargetChain(chainByUri(typeOfUri(prodRegistries[0]?.url ?? '')))

    setAdmins(authors)
    setVisibleContextId(contextId)
    await _updateCurrentAccount()
  }
  const _updateCurrentAccount = async () => {
    if (targetChain) {
      const { getAddress } = await initBGFunctions(browser)
      const currentAccount = await getAddress(DefaultSigners.EXTENSION, targetChain)

      setCurrentAccount(currentAccount)
    } else {
      return
    }
    setTimeout(() => {
      isNotNullCurrentAccount = !(
        !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
      )
    }, 1500)
  }

  const _transferOwnership = async (newAccount: string) => {
    try {
      const oldAccount = mi.author
      const { transferOwnership } = await initBGFunctions(browser)
      setNewOwnerLoading(true)
      await transferOwnership(targetRegistry, mi.name, newAccount, oldAccount)
      setNewOwnerLoading(false)
      setDappletsDetail(false)
    } catch (error) {
      setDisabledAddOwner(true)
      setNewOwnerLoading(false)
      setTimeout(() => {
        setDisabledAddOwner(false)
      }, 1000)
    }
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
      setModalTransaction(false)
      setModalPush(true)
    } catch (err) {
      console.log(err)

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

  const onChange = (e) => {
    const files = e.target.files
    const filesArr = Array.prototype.slice.call(files)
    setNewState([...filesArr])
  }

  const visibleNameFile = (hash: string): string => {
    const firstCharacters = hash.substring(0, 6)
    const lastCharacters = hash.substring(hash.length - 1, hash.length - 5)
    return `${firstCharacters}...${lastCharacters}`
  }

  const getAdmins = async () => {
    const { getAdmins } = await initBGFunctions(browser)
    if (!targetRegistry) return

    const authors = await getAdmins(targetRegistry, mi.name)

    setAdmins(authors)
  }

  function containsValue(arr, elem: string) {
    if (!arr) return
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].toLowerCase() === elem.toLowerCase()) {
        return true
      }
    }
    return false
  }

  const _addContextId = async (contextId: string) => {
    setEditContextIdLoading(true)
    setAddDisabled(true)

    try {
      const { addContextId, getContextIds } = await initBGFunctions(browser)
      if (!targetRegistry || !mi.name || !contextId) return

      await addContextId(targetRegistry, mi.name, contextId)
      const contextIds = await getContextIds(targetRegistry, mi.name)
      // node.current?.classList.remove('valid')
      setVisibleContextId(contextIds)
      setEditContextId('')
    } catch (error) {
      node.current?.classList.remove('valid')
    } finally {
      node.current?.classList.remove('valid')
      setEditContextId('')
      setEditContextIdLoading(false)
      setAddDisabled(false)
    }
  }

  const _removeContextID = async (contextId: string) => {
    setEditContextIdLoading(true)
    setAddDisabled(true)

    try {
      const { removeContextId, getContextIds } = await initBGFunctions(browser)
      if (!targetRegistry || !mi.name || !contextId) return

      await removeContextId(targetRegistry, mi.name, contextId)
      const contextIds = await getContextIds(targetRegistry, mi.name)

      setVisibleContextId(contextIds)
    } catch (error) {
    } finally {
      setEditContextIdLoading(false)
      setAddDisabled(false)
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

  const getNumIndex = (value, reg) => {
    try {
      const valueReg = value.match(reg)

      return valueReg
    } catch {}
  }
  const _addAdmin = async (address: string) => {
    setEditAdminsLoading(true)
    setAddAdminDisabled(true)
    const validValue = containsValue(admins, address)
    const valueParse = getNumIndex(address, regExpIndexEthereum)
    if (validValue || valueParse === null) {
      setDisabledAddAdmin(true)
      setEditAdminsLoading(false)
      setAddAdminDisabled(false)
      setTimeout(() => {
        setDisabledAddAdmin(false)
      }, 1000)
    } else {
      try {
        const { addAdmin } = await initBGFunctions(browser)
        await addAdmin(targetRegistry, mi.name, address)

        setEditAdminDone(true)
        setVisibleAdmins(true)
        setEditAdminsLoading(false)
        setAddAdminDisabled(false)
        // nodeBtnAdmin.current?.classList.remove('valid')
        // nodeBtnAdmin.current?.classList.remove('valid')
        setEditAdmin('')
        await getAdmins()
      } catch (error) {
        setEditAdminDone(true)
        setVisibleAdmins(false)
        setEditAdminsLoading(false)
        setAddAdminDisabled(false)
        // nodeBtnAdmin.current?.classList.remove('valid')
      }
    }
  }
  const _deleteAdmin = async (address: string) => {
    setEditAdminsLoading(true)
    setAddAdminDisabled(true)

    try {
      const { removeAdmin } = await initBGFunctions(browser)
      await removeAdmin(targetRegistry, mi.name, address)

      setEditAdmin('')
      await getAdmins()
    } catch (error) {
      nodeBtnAdmin.current?.classList.remove('valid')
    } finally {
      nodeBtnAdmin.current?.classList.remove('valid')
      setEditAdminDone(true)
      setVisibleAdmins(false)
      setEditAdminsLoading(false)
      setAddAdminDisabled(false)
    }
  }
  const getCompareAdminValue = (x) => {
    let isCompare = false
    const validValue = containsValue(admins, x)
    const valueParse = getNumIndex(x, regExpIndexEthereum)

    if (validValue || valueParse === null) {
      return (isCompare = false)
    } else {
      return (isCompare = true)
    }
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
      {!isNotNullCurrentAccount ? (
        owner ? (
          <Modal
            classNameWrapper={styles.messageModalDefault}
            visible={isNotAccountModal}
            title={'The wrong wallet'}
            content={
              <>
                <p>Change account to {owner}</p>

                <br />
                <p> Connect a new wallet</p>
              </>
            }
            footer={''}
            onClose={() => setNotAccountModal(false)}
          />
        ) : (
          <Modal
            classNameWrapper={styles.messageModalDefault}
            visible={isNotAccountModal}
            classNameContent={styles.modalContentOwnership}
            title={'Wallet is not connected'}
            content={'You can not deploy a module without a wallet. Connect a new wallet'}
            footer={''}
            onClose={() => setNotAccountModal(false)}
          />
        )
      ) : null}

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
              <div className={styles.iconBlock}>
                <div className={styles.imgBlock}>
                  <StorageRefImage className={styles.img} storageRef={mi.icon} />

                  {newState.map((x, i) => (
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
        <SettingWrapper
          title="Ownership"
          className={styles.wrapperSettings}
          children={
            <div className={styles.ownershipBlock}>
              <SettingItem
                title="Ownership"
                component={<></>}
                className={styles.item}
                children={
                  <div className={styles.inputOwnershipBlock}>
                    <input
                      value={newOwner}
                      className={cn(styles.inputOwnership, {
                        [styles.inputOwnershipInvalid]: isDisabledAddOwner,
                      })}
                      placeholder={mi.author || 'New owner adress'}
                      onChange={(e) => {
                        setNewOwner(e.target.value)
                        setDisabledAddOwner(false)
                      }}
                      onBlur={() => setDisabledAddOwner(false)}
                    />

                    <button
                      disabled={newOwner.length <= 0}
                      onClick={() => {
                        _transferOwnership(newOwner)
                      }}
                      className={cn(styles.ownershipButton, {
                        [styles.ownershipButtonDisabled]: newOwner.length <= 0,
                      })}
                    >
                      Change
                    </button>
                    <Modal
                      visible={newOwnerLoading}
                      classNameContent={styles.modalContentOwnership}
                      title={'Changing the Owner'}
                      content={
                        'This modal window will close automatically after your changes are saved'
                      }
                      footer={''}
                      onClose={() => setNewOwnerLoading(false)}
                    />
                  </div>
                }
              />
              <>
                {isLoad || !targetRegistry ? (
                  <div className={styles.miniLoader}></div>
                ) : (
                  <div className={styles.parametersBlock}>
                    <div className={styles.wrapperContextID}>
                      <div className={styles.blockContextID}>
                        <h3 className={styles.blockContextIDTitle}>Admins</h3>
                        <button
                          // disabled={autorDisabled}
                          onClick={() => setVisibleAdmins(!visibleAdmins)}
                          className={cn(styles.contextIDButton, {
                            // [styles.contextIDButtonDisabled]: mi.contextIds.length >= 1,
                          })}
                        />
                      </div>
                      {visibleAdmins && (
                        <div className={styles.wrapperContext}>
                          <div
                            className={cn(styles.blockContext, {
                              // [styles.inputAdminInvalid]: isDisabledAddAdmin,
                            })}
                          >
                            <input
                              ref={nodeInputAdmin}
                              className={styles.blockContextTitle}
                              value={editAdmin}
                              onChange={(e) => {
                                setEditAdmin(e.target.value)
                              }}
                            />

                            <button
                              // ref={nodeBtnAdmin}
                              onClick={() => {
                                setEditAdmin('')
                              }}
                              className={cn(styles.contextDelete, {
                                // [styles.contextDeleteNone]: adminDeleteNone,
                              })}
                            >
                              <Delete />
                            </button>
                          </div>
                          <button
                            disabled={
                              (editAdmin.length < 2 && !getCompareAdminValue(editAdmin)) ||
                              (addAdminDisabled && !getCompareAdminValue(editAdmin))
                            }
                            ref={nodeBtnAdmin}
                            onClick={() => {
                              // nodeBtnAdmin.current?.classList.add('valid')
                              _addAdmin(editAdmin)
                            }}
                            className={cn(styles.addContextDisabled, {
                              [styles.addContext]:
                                (nodeInputAdmin.current?.value.length >= 2 &&
                                  !addAdminDisabled &&
                                  getCompareAdminValue(editAdmin)) ||
                                (editAdmin.length >= 2 &&
                                  !addAdminDisabled &&
                                  getCompareAdminValue(editAdmin)),
                            })}
                          >
                            ADD
                          </button>
                        </div>
                      )}
                      {editAdminsLoading ? (
                        <div className={styles.editContextIdLoading}></div>
                      ) : (
                        <>
                          {admins && admins.length
                            ? admins.map((x, i) => (
                                <div key={i} className={styles.blockContext}>
                                  <input
                                    className={styles.blockContextTitle}
                                    placeholder={x}
                                    value={x}
                                    readOnly
                                  />

                                  <button
                                    ref={nodeBtnAdmin}
                                    onClick={() => _deleteAdmin(x)}
                                    className={cn(styles.addcontextDelete)}
                                  />
                                </div>
                              ))
                            : null}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            </div>
          }
        />

        <SettingWrapper
          title="Parameters"
          className={styles.wrapperSettings}
          children={
            <>
              {isLoad || !targetRegistry ? (
                <div className={styles.miniLoader}></div>
              ) : (
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
                          {editContextIdLoading ? null : (
                            <button
                              ref={node}
                              onClick={() => {
                                onDeleteChildContext(i)
                                setEditContextId('')
                              }}
                              className={cn(styles.contextDelete)}
                            >
                              <Delete />
                            </button>
                          )}
                        </div>
                        <button
                          disabled={editContextId.length <= 2 || addDisabled}
                          onClick={() => {
                            node.current?.classList.add('valid')
                            _addContextId(editContextId)
                          }}
                          className={cn(styles.addContextDisabled, {
                            [styles.addContext]:
                              (editContextId.length >= 2 && !addDisabled) ||
                              (nodeInput.current?.value.length >= 2 && !addDisabled),
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
                        {visibleContextId && visibleContextId.length
                          ? visibleContextId.map((x, i) => (
                              <div key={i} className={styles.blockContext}>
                                <input
                                  className={styles.blockContextTitle}
                                  placeholder={x}
                                  value={x}
                                  readOnly
                                />

                                <button
                                  ref={node}
                                  onClick={() => {
                                    _removeContextID(x)
                                  }}
                                  className={cn(styles.addcontextDelete)}
                                />
                              </div>
                            ))
                          : null}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          }
        />
      </div>
      <div className={styles.linkNavigation}>
        <button
          onClick={() => {
            setDappletsDetail(false)
            setShowChildrenRegistry(true)
          }}
          className={styles.back}
        >
          <Back />
          Back
        </button>
        <button
          disabled={isDisabledPush}
          onClick={() => saveChanges()}
          className={cn(styles.push, {
            [styles.pushDisabled]: isDisabledPush,
          })}
        >
          Push changes
        </button>
      </div>
      <Modal
        visible={isModalPush}
        title="Сhanges were accepted"
        content={
          <div className={styles.modalDefaultContent}>
            Your dapplet has been updated
            <button
              onClick={() => {
                setDappletsDetail(false)
                setShowChildrenRegistry(true)
              }}
              className={styles.modalDefaultContentButton}
            >
              OK
            </button>
          </div>
        }
        footer={''}
        onClose={() => {
          setDappletsDetail(false)
          setShowChildrenRegistry(true)
        }}
      />
      <Modal
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
