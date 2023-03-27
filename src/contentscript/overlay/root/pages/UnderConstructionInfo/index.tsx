import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import { StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes } from '../../../../../common/types'
import { ReactComponent as Delete } from '../../assets/icons/mini-close.svg'
import { Modal } from '../../components/Modal'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import { StorageRefImage } from '../../components/StorageRefImage'
import styles from './UnderConstructionInfo.module.scss'
import './valid.scss'

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
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [message, setMessage] = useState(null)
  const [owner, setOwner] = useState(null)
  const [editContextId, setEditContextId] = useState('')
  const [editContextIdLoading, setEditContextIdLoading] = useState(false)
  const [targetStorages, setTargetStorages] = useState([StorageTypes.Swarm, StorageTypes.Ipfs])
  const fileInput = useRef<HTMLInputElement>()
  const [st, setSt] = useState([])
  const [isDisabledPush, setDisabledPush] = useState(true)
  const [isModal, setModal] = useState(false)
  const [isModalPush, setModalPush] = useState(false)
  const [isModalTransaction, setModalTransaction] = useState(false)
  const [isNotAccountModal, setNotAccountModal] = useState(false)
  const [isLoad, setLoad] = useState(false)
  const node = useRef<HTMLButtonElement>()
  const nodeInput = useRef<HTMLInputElement>()
  const [visibleContextId, setVisibleContextId] = useState([])
  const [contextDeleteNone, setContextDeleteNone] = useState(false)
  const [addDisabled, setAddDisabled] = useState(false)

  const onClose = () => setModal(false)

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
    return () => {}
  }, [])

  const _updateData = async () => {
    const { getRegistries, getTrustedUsers, getContextIds } = await initBGFunctions(browser)

    const registries = await getRegistries()
    const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)
    const contextId = await getContextIds(prodRegistries[0]?.url, mi.name)

    setVisibleContextId(contextId)
    setTargetRegistry(prodRegistries[0]?.url || null)
    setTargetChain(chainByUri(typeOfUri(prodRegistries[0]?.url ?? '')))
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
    } catch (error) {
    } finally {
      setEditContextId('')
      setEditContextIdLoading(false)
      setAddDisabled(false)
      node.current?.classList.remove('valid')
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
    const firstCharacters = hash.substring(0, 6)
    const lastCharacters = hash.substring(hash.length - 1, hash.length - 6)

    return `${firstCharacters}...${lastCharacters}`
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

          <SettingWrapper
            title="Parameters"
            className={styles.wrapperSettings}
            children={
              <>
                {isLoad ? (
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

                            <button
                              ref={node}
                              onClick={() => {
                                onDeleteChildContext(i)
                                setEditContextId('')
                              }}
                              className={cn(styles.contextDelete, {
                                [styles.contextDeleteNone]: contextDeleteNone,
                              })}
                            >
                              <Delete />
                            </button>
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
