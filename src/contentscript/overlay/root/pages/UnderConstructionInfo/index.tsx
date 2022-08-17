import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import { StorageTypes } from '../../../../../common/constants'
import { chainByUri, typeOfUri } from '../../../../../common/helpers'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { InputGroup } from '../../components/InputGroup'

import { Modal } from '../../components/Modal'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import { StorageRefImage } from '../../components/StorageRefImage'
import { _addInfoItemInputGroup } from '../../utils/addInfoInputGroup'
import { _removeInfoItemInputGroup } from '../../utils/removeInfoInputGroup'
import styles from './UnderConstructionInfo.module.scss'
import './valid.scss'

enum DependencyType {
  Dependency,
  Interface,
}

export interface UnderConstructionInfoProps {
  ModuleInfo: any
  ModuleVersion: any
  setUnderConstructionDetails: (x) => void
  setShowChildrenUnderConstraction: (x) => void
}

let _isMounted = false

export const UnderConstructionInfo: FC<UnderConstructionInfoProps> = (props) => {
  const {
    setUnderConstructionDetails,
    ModuleInfo,
    ModuleVersion,
    setShowChildrenUnderConstraction,
  } = props

  const [originalMi, setOriginalMi] = useState(null)
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)

  const [loading, setLoading] = useState(false)
  const [targetRegistry, setTargetRegistry] = useState(null)
  const [targetChain, setTargetChain] = useState<ChainTypes>(null)
  const [message, setMessage] = useState(null)
  const [registryOptions, setRegistryOptions] = useState([])
  const [owner, setOwner] = useState(null)
  const [currentAccount, setCurrentAccount] = useState(null)

  const [trustedUsers, setTrustedUsers] = useState([])

  const [targetStorages, setTargetStorages] = useState([
    StorageTypes.Swarm,
    StorageTypes.Sia,
    StorageTypes.Ipfs,
  ])

  const fileInput = useRef<HTMLInputElement>()
  const [st, setSt] = useState([])

  const [isDisabledPush, setDisabledPush] = useState(true)
  const [isModal, setModal] = useState(false)
  const onClose = () => setModal(false)
  const [autorDisabled, setAuthorDisabled] = useState(false)
  const [isModalPush, setModalPush] = useState(false)

  const [isModalTransaction, setModalTransaction] = useState(false)
  const [isNotAccountModal, setNotAccountModal] = useState(false)

  const [visible, setVisible] = useState(false)
  const [visibleAdmins, setVisibleAdmins] = useState(false)

  const nodeBtn = useRef<HTMLButtonElement>()
  const nodeInput = useRef<HTMLInputElement>()
  const nodeInputAdmin = useRef<HTMLInputElement>()
  const nodeBtnAdmin = useRef<HTMLButtonElement>()

  const [addDisabled, setAddDisabled] = useState(false)
  const [contextId, setContextId] = useState(null)
  const [editContextId, setEditContextId] = useState('')
  const [editContextIdLoading, setEditContextIdLoading] = useState(false)

  const [addAdminDisabled, setAddAdminDisabled] = useState(false)
  const [editAdminsLoading, setEditAdminsLoading] = useState(false)
  const [editAdmin, setEditAdmin] = useState('')
  const [admins, setAdmins] = useState(null)
  const [isDisabledAddContext, setDisabledAddContext] = useState(false)
  const [isDisabledAddAdmin, setDisabledAddAdmin] = useState(false)
  let isNotNullCurrentAccount
  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await _updateData()
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [mi, targetChain, editContextId, editAdmin])

  const _updateData = async () => {
    const { getRegistries } = await initBGFunctions(browser)
    const registries = await getRegistries()
    const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)
    setTargetRegistry(prodRegistries[0]?.url || null)
    setTargetChain(chainByUri(typeOfUri(prodRegistries[0]?.url ?? '')))

    await _updateCurrentAccount()
    if (!targetRegistry) return
    await getContextId()
    await getAdmins()
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

  const onChange = (e) => {
    const files = e.target.files

    const filesArr = Array.prototype.slice.call(files)

    setSt([...filesArr])
  }

  const getContextId = async () => {
    const { getContextIds } = await initBGFunctions(browser)
    const newContextID = await getContextIds(targetRegistry, mi.name)
    setContextId(newContextID)
  }
  const getAdmins = async () => {
    const { getAdmins } = await initBGFunctions(browser)
    const authors = await getAdmins(targetRegistry, mi.name)
    setAdmins(authors)
  }

  const visibleNameFile = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 6)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  function containsValue(arr, elem: string) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].toLowerCase() === elem.toLowerCase()) {
        return true
      }
    }
    return false
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
        <SettingWrapper
          title="Team"
          className={styles.wrapperSettings}
          children={
            <div className={styles.ownershipBlock}>
              <InputGroup
                title={'Admins'}
                newArray={admins}
                _deleteItem={_removeInfoItemInputGroup}
                _addItem={_addInfoItemInputGroup}
                nodeInput={nodeInputAdmin}
                nodeBtn={nodeBtnAdmin}
                isDisabledAdd={isDisabledAddAdmin}
                addDisabled={addAdminDisabled}
                setAddDisabled={setAddAdminDisabled}
                editLoading={editAdminsLoading}
                editInput={editAdmin}
                setEditInput={setEditAdmin}
                visibleArray={visibleAdmins}
                setVisibleArray={setVisibleAdmins}
                parameters={'admins'}
                setEditLoading={setEditAdminsLoading}
                containsValue={containsValue}
                setDisabledAdd={setDisabledAddAdmin}
                targetRegistry={targetRegistry}
                mi={mi}
                getParameters={getAdmins}
              />
            </div>
          }
        />
        <SettingWrapper
          title="Parameters"
          className={styles.wrapperSettings}
          children={
            <div className={styles.parametersBlock}>
              <InputGroup
                title={'Context IDs'}
                newArray={contextId}
                _deleteItem={_removeInfoItemInputGroup}
                _addItem={_addInfoItemInputGroup}
                nodeInput={nodeInput}
                nodeBtn={nodeBtn}
                isDisabledAdd={isDisabledAddContext}
                addDisabled={addDisabled}
                editLoading={editContextIdLoading}
                editInput={editContextId}
                setEditInput={setEditContextId}
                visibleArray={visible}
                setVisibleArray={setVisible}
                parameters={'contextId'}
                setEditLoading={setEditContextIdLoading}
                setAddDisabled={setAddDisabled}
                containsValue={containsValue}
                setDisabledAdd={setDisabledAddContext}
                targetRegistry={targetRegistry}
                mi={mi}
                getParameters={getContextId}
              />
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
