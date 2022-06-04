import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import * as EventBus from '../../../../../../common/global-event-bus'
import { WalletDescriptor } from '../../../../../../common/types'
import { ReactComponent as Card } from '../../../assets/svg/card.svg'
import styles from './HeaderLogIn.module.scss'
// import makeBlockie from 'ethereum-blockies-base64'
import makeBlockie from 'ethereum-blockies-base64'
import { browser } from 'webextension-polyfill-ts'
export interface HeaderLogInProps {
  avatar?: string
  hash?: string
  isMini: boolean
  setOpen: () => void
  setMini: () => void
  isOpen: boolean
  setNotLogIn: (x: any) => void
  isNotLogin: boolean
  isEns: boolean
  setEns: (x: boolean) => void
  setModalWalletConnect: (x: boolean) => void
  newProfile: any
  setNewProfile: (x: any) => void
  // onDeleteChildConnectNewProfile: (x: any) => void
}
let _isMounted = false
export const HeaderLogIn: FC<HeaderLogInProps> = (props: HeaderLogInProps) => {
  const {
    avatar,
    hash,
    isMini,
    setOpen,
    setMini,
    isOpen,
    setNotLogIn,

    isNotLogin,
    isEns,
    setEns,
    setModalWalletConnect,
    newProfile,
    setNewProfile,
    // onDeleteChildConnectNewProfile,
  } = props
  const modalRef = useRef<HTMLInputElement>()
  const [descriptors, setDescriptors] = useState<WalletDescriptor[]>([])
  const connectedDescriptors = descriptors.filter((x) => x.connected)
  useEffect(() => {
    const init = async () => {
      refresh()
      _isMounted = true
    }

    init()

    return () => {
      _isMounted = false
      _isMounted = false
      EventBus.off('wallet_changed', refresh)
    }
  }, [isOpen, isMini, isEns, newProfile, isNotLogin])
  const refresh = async () => {
    const { getWalletDescriptors } = await initBGFunctions(browser)

    const descriptors = await getWalletDescriptors()

    if (_isMounted) {
      setDescriptors(descriptors)
    }
  }

  const onDeleteChildConnectNewProfile = (id: any) => {
    newProfile.splice(id, 1)

    setNewProfile(newProfile.splice(id, 1))

    return newProfile
  }
  const filteredDapplets = useMemo(() => {
    return newProfile
  }, [newProfile])

  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 5)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const handleBlur = (e) => {
    const currentTarget = e.currentTarget

    setTimeout(() => {
      if (!currentTarget.contains(document.activeElement)) {
        setOpen()
        setMini()
      }
    }, 0)
  }

  return (
    <div className={styles.wrapper}>
      <header
        className={cn(styles.header, {
          [styles.mini]: isMini,
        })}
        onClick={() => {
          setOpen()
          setMini()
        }}
      >
        {/* <Avatar avatar={avatar} size="big" className={styles.avatar} /> */}
        <span
          // avatar={Card}
          // size="big"
          className={styles.avatar}
          onClick={() => {
            setOpen()
            setMini()
          }}
        >
          <Card />
        </span>
        {!isMini && (
          <div className={cn(styles.wrapperNames)}>
            {isEns ? (
              <>
                <div className={styles.ensNameBlock}>
                  <p className={styles.ensName}>UserENSName</p>
                  <span className={styles.ensLabel}>ens</span>
                </div>
                <p className={styles.ensHash}>{visible(hash)}</p>
              </>
            ) : (
              <p className={styles.hash}>{visible(hash)}</p>
            )}
          </div>
        )}
        {/* {!isMini && <Down />} */}
      </header>
      {isOpen && (
        // !mini &&

        <div
          className={cn(styles.fakeModal, {
            [styles.fakeModalWrapper]: true,
          })}
        >
          <span
            // avatar={Card}
            // size="big"
            className={styles.avatar}
            onClick={() => {
              setOpen()
              setMini()
            }}
          >
            <Card />
          </span>
          <div
            tabIndex={0}
            // ref={modalRef}
            // tabIndex={1}
            // onBlur={() => {
            //   setOpen()
            //   setMini()
            // }}
            // tabIndex={-1}
            onBlur={handleBlur}
            className={cn(styles.headerWrapperIsOpen, {
              [styles.isOpen]: isOpen,
            })}
          >
            <div className={styles.profileBlock}>
              <div className={styles.profileBlockImg}>
                {/* <img className={styles.profileImg} src={avatar}></img> */}
                <span
                  // avatar={Card}
                  // size="big"
                  className={styles.profileImg}
                  onClick={() => {
                    setOpen()
                    setMini()
                  }}
                >
                  <Card />
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // setOpen()
                    // setMini()
                    // setEns(false)
                    setNotLogIn(true)
                  }}
                  className={styles.profileImgButton}
                />
              </div>
              {isEns ? (
                <>
                  <span className={styles.ensLabel}>ens</span>
                  <p className={styles.ensName}>UserENSName</p>
                  {/* <p className={styles.ensHash}>{visible(hash)}</p> */}
                  <p className={styles.ensHash}>wallets</p>
                </>
              ) : (
                // <p className={styles.notEnsHash}>{visible(hash)}</p>
                <p className={styles.notEnsHash}>wallets</p>
              )}

              <a className={styles.profileLink}>Profile</a>
            </div>
            <div className={styles.walletBlock}>
              {connectedDescriptors &&
                connectedDescriptors.map((x, i) => (
                  <div key={i} className={styles.newProfileBlock}>
                    <div className={styles.newProfileBlockInfo}>
                      {x.account ? (
                        <img src={makeBlockie(x.account)} className={styles.newProfileBlockImg} />
                      ) : null}
                      {x.account ? (
                        <p title={x.account} className={styles.newProfileBlockName}>
                          {x.account.length === 42
                            ? x.account.substr(0, 6) + '...' + x.account.substr(38)
                            : x.account}
                        </p>
                      ) : null}
                      {/* <img className={styles.newProfileBlockImg} src={x.img} /> */}
                      {/* <p className={styles.newProfileBlockName}>{x.title}</p> */}
                    </div>
                    <button
                      onClick={() => {
                        onDeleteChildConnectNewProfile(i)
                        // setNewProfile(newProfile)
                      }}
                      className={styles.profileImgButton}
                    />
                  </div>
                ))}
              <div className={styles.addWallet}>
                <button
                  onClick={() => setModalWalletConnect(true)}
                  className={styles.AddUser}
                ></button>
                <span className={styles.AddUserLabel}>Add Wallet</span>
              </div>
            </div>
            <button
              onClick={() => {
                setNotLogIn(true)
                setMini()
                setOpen()
                setEns(false)
              }}
              className={styles.logOut}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
