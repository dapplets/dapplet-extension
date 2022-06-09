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
import { ReactComponent as Card } from '../../../assets/svg/card.svg'
import styles from './HeaderLogIn.module.scss'
// import makeBlockie from 'ethereum-blockies-base64'
import makeBlockie from 'ethereum-blockies-base64'
import { browser } from 'webextension-polyfill-ts'
import { mergeSameWallets } from '../../../../../../common/helpers'

export interface HeaderLogInProps {
  avatar?: string
  hash?: string
  isMini: boolean
  setOpen: () => void
  // setMini: () => void
  isOpen: boolean
  handleWalletLengthDisconnect: () => void

  setModalWalletConnect: (x: boolean) => void
  newProfile: any
  setNewProfile: (x: any) => void
  isOverlay: boolean
}
let _isMounted = false
export const HeaderLogIn: FC<HeaderLogInProps> = (props: HeaderLogInProps) => {
  const {
    isMini,
    setOpen,
    // setMini,
    isOpen,
    handleWalletLengthDisconnect,

    newProfile,
    setNewProfile,
    isOverlay,
  } = props

  const [descriptors, setDescriptors] = useState<WalletDescriptor[]>([])
  const connectedDescriptors = mergeSameWallets(descriptors.filter((x) => x.connected))
  const [isModal, setModal] = useState(false)
  const onCloseModalWantLink = () => setModal(false)
  useEffect(() => {
    const init = async () => {
      _isMounted = true
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
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 7)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const disconnectButtonClick = async (chain: ChainTypes, wallet: WalletTypes) => {
    const { disconnectWallet } = await initBGFunctions(browser)
    await disconnectWallet(chain, wallet)
  }
  const connectWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    if (isOverlay) {
      await pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      // await this.componentDidMount()
    } else {
      pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      window.close()
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
          // setMini()
        }}
      >
        <span
          className={styles.avatar}
          onClick={() => {
            setOpen()
            // setMini()
          }}
        >
          <Card />
        </span>
        {!isMini && (
          <div className={cn(styles.wrapperNames)}>
            <p className={styles.hash}>wallets</p>
          </div>
        )}
      </header>

      <Modal
        visible={isOpen}
        refresh={refresh}
        disconnectButtonClick={disconnectButtonClick}
        wallets={connectedDescriptors}
        setOpen={setOpen}
        onClose={() => setOpen()}
        connectWallet={connectWallet}
      />
    </div>
  )
}
interface ModalProps {
  visible: boolean

  onClose?: () => void
  setOpen: any
  wallets: any
  disconnectButtonClick: (x: any, y: any) => void
  refresh: () => void
  connectWallet: () => void
}

export const Modal = ({
  visible = false,

  onClose,
  setOpen,
  wallets,
  disconnectButtonClick,
  refresh,
  connectWallet,
}: ModalProps) => {
  const onKeydown = ({ key }: KeyboardEvent) => {
    switch (key) {
      case 'Escape':
        onClose()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  })

  if (!visible) return null

  const newVisible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 7)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  return (
    <div
      onClick={onClose}
      className={cn(styles.fakeModal, {
        [styles.fakeModalWrapper]: true,
      })}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(styles.headerWrapperIsOpen, {
          [styles.isOpen]: true,
        })}
      >
        <div className={styles.profileBlock}>
          <div className={styles.profileBlockImg}>
            <span
              className={styles.profileImg}
              // onClick={() => {
              //   setOpen()
              //   setMini()
              // }}
            >
              <Card />
            </span>
          </div>

          <p className={styles.notEnsHash}>wallets</p>
        </div>
        <div className={styles.walletBlock}>
          {wallets &&
            wallets.map((x, i) => (
              <div key={i} className={styles.newProfileBlock}>
                <div className={styles.newProfileBlockInfo}>
                  {x.account ? (
                    <img src={makeBlockie(x.account)} className={styles.newProfileBlockImg} />
                  ) : null}
                  {x.account ? (
                    <p title={x.account} className={styles.newProfileBlockName}>
                      {newVisible(x.account)}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => {
                    disconnectButtonClick(x.chain, x.type)
                    refresh()
                  }}
                  className={styles.profileImgButton}
                />
              </div>
            ))}
          <div
            className={styles.addWallet}
            onClick={() => {
              setOpen()
              connectWallet()
            }}
          >
            <button className={styles.AddUser}></button>
            <span style={{ cursor: 'pointer' }} className={styles.AddUserLabel}>
              Add Wallet
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
