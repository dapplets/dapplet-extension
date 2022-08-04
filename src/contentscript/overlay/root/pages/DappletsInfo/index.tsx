import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { StorageRefImage } from '../../components/DevModulesList'
import { Modal } from '../../components/Modal'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import styles from './DappletsInfo.module.scss'

export interface DappletsMainInfoProps {
  setDappletsDetail: (x) => void
  ModuleInfo: any
  ModuleVersion: any
  setShowChildrenRegistery: (x) => void
}

let _isMounted = false

export const DappletsMainInfo: FC<DappletsMainInfoProps> = (props) => {
  const { setDappletsDetail, ModuleInfo, ModuleVersion, setShowChildrenRegistery } = props
  const [originalMi, setOriginalMi] = useState(null)
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [vi, setVi] = useState<VersionInfo>(ModuleVersion)
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
  const [trustedUsers, setTrustedUsers] = useState([])
  const [targetStorages, setTargetStorages] = useState([
    StorageTypes.Swarm,
    StorageTypes.Sia,
    StorageTypes.Ipfs,
  ])
  const fileInput = useRef<HTMLInputElement>()
  const [newState, setNewState] = useState([])
  const [isDisabledPush, setDisabledPush] = useState(true)
  const [isDisabledAddOwner, setDisabledAddOwner] = useState(false)
  const [isModal, setModal] = useState(false)
  const onClose = () => setModal(false)
  const [isModalPush, setModalPush] = useState(false)
  const [isModalTransaction, setModalTransaction] = useState(false)
  const [autorDisabled, setAuthorDisabled] = useState(false)
  const [author, setAuthor] = useState({ authorForm: [] })
  const newAuthorObject = {
    author: '',
  }
  const [isNotAccountModal, setNotAccountModal] = useState(false)
  const [visible, setVisible] = useState(false)
  const nodeBtn = useRef<HTMLButtonElement>()
  const nodeInput = useRef<HTMLInputElement>()
  const [visibleContextId, setVisibleContextId] = useState({
    visibleContext: [],
  })
  const [contextDeleteNone, setContextDeleteNone] = useState(false)
  const [addDisabled, setAddDisabled] = useState(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await _updateData()
      if (!isNotNullCurrentAccount) {
        setNotAccountModal(true)
      } else {
        setNotAccountModal(false)
      }
    }
    init()
    if (author.authorForm.length === 0) {
      setAuthorDisabled(false)
    }

    return () => {
      _isMounted = false
    }
  }, [mi, newState, targetChain, autorDisabled, author, editContextId])

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

    await _updateCurrentAccount()
  }
  const _updateCurrentAccount = async () => {
    const { getOwnership, getAddress } = await initBGFunctions(browser)

    const currentAccount = await getAddress(DefaultSigners.EXTENSION, targetChain)

    setCurrentAccount(currentAccount)
  }

  const _transferOwnership = async (newAccount: string) => {
    try {
      const oldAccount = mi.author
      const { transferOwnership } = await initBGFunctions(browser)
      setNewOwnerLoading(true)
      await transferOwnership(targetRegistry, mi.name, newAccount, oldAccount)

      setNewOwnerLoading(false)
      setDappletsDetail(false)
      setNewOwnerDone(true)
    } catch (error) {
      setDisabledAddOwner(true)
      setNewOwnerLoading(false)
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

      setOriginalMi(JSON.parse(JSON.stringify(mi)))

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
  // const isNotNullCurrentAccount = !(
  //   !currentAccount || currentAccount === '0x0000000000000000000000000000000000000000'
  // )
  const isNotNullCurrentAccount = true

  const onChange = (e) => {
    const files = e.target.files

    const filesArr = Array.prototype.slice.call(files)

    setNewState([...filesArr])
  }

  const addButtonClickHandler = (e) => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.push(newAuthorObject)
    setAuthor(newAuthor)
  }
  const messagesContainer = useRef<HTMLDivElement>()

  const onDeleteChild = (id: number) => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.splice(id, 1)
    setAuthor(newAuthor)
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
      const { addContextId } = await initBGFunctions(browser)
      await addContextId(targetRegistry, mi.name, contextId)
      const newForm = Object.assign({}, visibleContextId)

      newForm.visibleContext.push(editContextId)
      setVisibleContextId(newForm)

      setEditContextIdDone(true)
      setVisible(true)
      setEditContextId('')
      setEditContextIdLoading(false)
      setAddDisabled(false)
      nodeBtn.current?.classList.remove('valid')
      setEditContextId('')
    } catch (error) {
      setEditContextIdDone(true)
      setVisible(false)
      setEditContextIdLoading(false)
      setAddDisabled(false)
      nodeBtn.current?.classList.remove('valid')
    }
  }
  const visibleNameFile = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 5)

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
              {/* <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={<textarea className={styles.fullDescription} />}
              /> */}

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
              {/* <div className={styles.wrapperAdmins}>
                <div className={styles.blockAdmins}>
                  <h3 className={styles.adminsTitle}>Admins</h3>
                  <button
                    disabled={autorDisabled}
                    onClick={(e) => {
                      addButtonClickHandler(e)
                      setAuthorDisabled(true)
                    }}
                    className={cn(styles.adminsButton, {
                      [styles.adminsButtonDisabled]: autorDisabled,
                    })}
                  />
                </div>
                {author.authorForm.map((x, i) => (
                  <div ref={messagesContainer} key={i} className={styles.blockAuthors}>
                    <input
                      className={styles.authorTitle}
                      placeholder={x.author}
                      onChange={(e) => {
                        author.authorForm[i].author = e.target.value
                        if (e.target.value.length !== 0) {
                          setAuthorDisabled(false)
                        }
                      }}
                    />
                    <button onClick={() => onDeleteChild(i)} className={styles.authorDelete} />
                  </div>
                ))}
              </div> */}
            </div>
          }
        />

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
                        ref={nodeBtn}
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
                        nodeBtn.current?.classList.add('valid')
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
                      visibleContextId.visibleContext.map((x, i) => (
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
            setDappletsDetail(false)
            setShowChildrenRegistery(true)
          }}
          className={styles.back}
        >
          Back
        </button>
        <button
          disabled={isDisabledPush || !isNotNullCurrentAccount}
          onClick={() => saveChanges()}
          className={cn(styles.push, {
            [styles.pushDisabled]: isDisabledPush || !isNotNullCurrentAccount,
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
                setShowChildrenRegistery(true)
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
          setShowChildrenRegistery(true)
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
