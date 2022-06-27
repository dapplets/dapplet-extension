import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useMemo, useState } from 'react'
import * as EventBus from '../../../../../../common/global-event-bus'
import {
  ChainTypes,
  DefaultSigners,
  WalletDescriptor,
  WalletTypes,
} from '../../../../../../common/types'
import { ReactComponent as WalletImg } from '../../../assets/svg/wallet.svg'
import styles from './HeaderLogIn.module.scss'

import makeBlockie from 'ethereum-blockies-base64'
import { browser } from 'webextension-polyfill-ts'
import { mergeSameWallets } from '../../../../../../common/helpers'
import * as walletIcons from '../../../../../../common/resources/wallets'
import { ReactComponent as Card } from '../../../assets/svg/card.svg'
import useCopied from '../../../hooks/useCopyed'
import { Wallet } from '../../../pages/Wallet'
import { Modal as ModalWallet } from '../../Modal'
export interface HeaderLogInProps {
  avatar?: string
  hash?: string
  isMini: boolean
  setOpen: () => void
  isOpen: boolean
  setModalWalletConnect: (x: boolean) => void
  newProfile: any
  isOverlay: boolean
}
let _isMounted = false
export const HeaderLogIn: FC<HeaderLogInProps> = (props: HeaderLogInProps) => {
  const { isMini, setOpen, isOpen, newProfile, isOverlay } = props

  const [descriptors, setDescriptors] = useState<WalletDescriptor[]>([])
  const connectedDescriptors = mergeSameWallets(descriptors.filter((x) => x.connected))
  const [isModal, setModal] = useState(false)
  const [isModalWallet, setModalWallet] = useState(false)
  const onCloseModalWallet = () => setModalWallet(false)
  const isEveryWalletConnected = descriptors.filter((x) => !x.connected).length === 0

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      refresh()
    }

    init()

    return () => {
      _isMounted = false
      EventBus.off('wallet_changed', refresh)
    }
  }, [isOpen, isMini, newProfile, isModal])

  const refresh = async () => {
    const { getWalletDescriptors } = await initBGFunctions(browser)
    const descriptors = await getWalletDescriptors()
    setDescriptors(descriptors)
  }

  const filteredProfile = useMemo(() => {
    return newProfile
  }, [newProfile])

  const disconnectButtonClick = async (chain: ChainTypes, wallet: WalletTypes) => {
    const { disconnectWallet } = await initBGFunctions(browser)
    await disconnectWallet(chain, wallet)
    await refresh()
  }
  const connectWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    if (isOverlay) {
      await pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      await refresh()
    } else {
      pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      window.close()
      await refresh()
    }
  }

  return (
    <div className={styles.wrapper}>
      <header
        className={cn(styles.header, {
          [styles.mini]: isMini,
        })}
        onClick={() => {
          setOpen()
        }}
      >
        <div
          className={styles.avatar}
          onClick={() => {
            setOpen()
          }}
        >
          <Card />
        </div>
        {!isMini && (
          <div className={cn(styles.wrapperNames)}>
            <p className={styles.hash}>wallets</p>
          </div>
        )}
      </header>

      <Modal
        visible={isOpen}
        disconnectButtonClick={disconnectButtonClick}
        wallets={connectedDescriptors}
        onClose={setOpen}
        connectWallet={isEveryWalletConnected ? null : connectWallet}
      />
      <ModalWallet
        visible={isModalWallet}
        content={''}
        footer={<Wallet isOverlay={true} />}
        onClose={() => onCloseModalWallet()}
      />
    </div>
  )
}
interface ModalProps {
  visible: boolean
  onClose?: () => void
  wallets: any
  disconnectButtonClick: (x: any, y: any) => void
  connectWallet?: () => void
}

export const Modal = ({
  visible = false,
  onClose,
  wallets,
  disconnectButtonClick,
  connectWallet,
}: ModalProps) => {
  const [isNotVisible, setNotVisible] = useState(false)
  const [value, setValue] = useState('')
  const [copied, copy, setCopied] = useCopied(value)
  const onKeydown = ({ key }: KeyboardEvent) => {
    switch (key) {
      case 'Escape':
        setNotVisible(true)
        setTimeout(() => {
          setNotVisible(false)
          onClose()
        }, 300)
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeydown)
    return () => {
      document.removeEventListener('keydown', onKeydown)
    }
  })
  useEffect(() => {}, [value])
  if (!visible) return null

  const newVisible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)
    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  return (
    <div
      onClick={() => {
        setNotVisible(true)
        setTimeout(() => {
          setNotVisible(false)
          onClose()
        }, 300)
      }}
      className={cn(styles.fakeModal, {
        [styles.fakeModalWrapper]: true,
      })}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(styles.headerWrapperIsOpen, {
          [styles.isOpen]: true,
          [styles.isNotVisible]: isNotVisible || !visible,
        })}
      >
        <div className={styles.profileBlock}>
          <div className={styles.profileBlockImg}>
            <span className={styles.profileImg}>
              <WalletImg />
            </span>
          </div>

          <p className={styles.notEnsHash}>wallets</p>
        </div>
        <div className={styles.walletBlock}>
          {wallets &&
            wallets.map((x, i) => (
              <div key={i} className={styles.newProfileBlock}>
                <div
                  onClick={() => {
                    console.log(wallets)
                  }}
                  className={styles.newProfileBlockInfo}
                >
                  {x.account ? (
                    <img src={makeBlockie(x.account)} className={styles.newProfileBlockImg} />
                  ) : null}
                  {x.account ? (
                    <div className={styles.meta}>
                      {x.type !== 'near' ? (
                        <p title={x.account} className={styles.newProfileBlockName}>
                          {newVisible(x.account)}
                        </p>
                      ) : (
                        <p title={x.account} className={styles.newProfileBlockNameNear}>
                          {x.account}
                        </p>
                      )}

                      {x.meta.icon ? (
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                          <img className={styles.walletsIcon} src={walletIcons[x.type]} alt="" />
                          {x.type === 'dapplets' ? (
                            <img className={styles.walletsIcon} src={walletIcons[x.type]} alt="" />
                          ) : (
                            <img className={styles.walletsIcon} src={x.meta.icon} alt="" />
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div
                  onClick={() => {
                    setValue(x.account)
                    setTimeout(() => {
                      copy()
                    }, 500)
                  }}
                  className={styles.copy}
                >
                  <span></span>
                </div>
                <div className={styles.profileImgButtonBlock}>
                  <button
                    onClick={() => {
                      disconnectButtonClick(x.chain, x.type)
                    }}
                    className={styles.profileImgButton}
                  />
                </div>
              </div>
            ))}
          {connectWallet && (
            <div
              className={styles.addWallet}
              onClick={() => {
                wallets.length >= 4 ? null : connectWallet()
              }}
            >
              <span
                data-title={
                  wallets.length >= 4
                    ? 'All of your wallets are already connected Disconnect one of them to add a new one'
                    : null
                }
                className={cn(styles.AddUserLabel, {
                  [styles.addWalletsDisabled]: wallets.length >= 4,
                })}
              >
                Add Wallet
                {wallets.length >= 4 ? (
                  <span className={styles.copied}>
                    All of your wallets are already connected Disconnect one of them to add a new
                    one
                  </span>
                ) : null}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
