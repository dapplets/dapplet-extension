import anime from 'animejs'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../../common/global-event-bus'
import * as walletIcons from '../../../../../../common/resources/wallets'
import {
  ChainTypes,
  DefaultSigners,
  WalletDescriptor,
  WalletTypes,
} from '../../../../../../common/types'

import { ReactComponent as Card } from '../../../assets/svg/card.svg'
import { Wallet } from '../../../pages/Wallet'
import { Modal as ModalWallet } from '../../Modal'
import { ModalLogin } from '../ModalLogin'
import styles from './HeaderLogIn.module.scss'

export interface HeaderLogInProps {
  isMini: boolean
  setOpen: () => void
  isOpen: boolean
  newProfile: any
  isOverlay: boolean
  setOpenWalletMini: () => void
  isOpenSearch: boolean
  setConnectedDescriptors: (x: []) => void
  setSelectWallet: (x: string) => void
}

export const HeaderLogIn: FC<HeaderLogInProps> = (props: HeaderLogInProps) => {
  const {
    isMini,
    setOpen,
    isOpen,
    newProfile,
    isOverlay,
    setOpenWalletMini,
    isOpenSearch,
    setConnectedDescriptors,
    setSelectWallet,
  } = props

  const [descriptors, setDescriptors] = useState<WalletDescriptor[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const connectedDescriptors = descriptors.filter((x) => x.connected)
  const [isModal, setModal] = useState(false)
  const [isModalWallet, setModalWallet] = useState(false)
  const onCloseModalWallet = async () => {
    setModalWallet(false)
    await refresh()
  }
  const [walletImage, setWalletImage] = useState(null)
  const [walletAccount, setWalletAccount] = useState(null)
  const [walletIcon, setWalletIcon] = useState(null)
  const [walletTypeWalletConnect, setWalletTypeWalletConnect] = useState(null)
  const liRef = useRef<HTMLDivElement>()

  const newVisible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)
    return `${firstFourCharacters}...${lastFourCharacters}`
  }
  // const isEveryWalletConnected = descriptors.filter((x) => !x.connected).length === 0

  useEffect(() => {
    const init = async () => {
      await refresh()
    }

    init()

    return () => {

      EventBus.off('wallet_changed', refresh)
    }
  }, [
    isOpen,
    isMini,
    newProfile,
    isModal,
    walletImage,
    walletAccount,
    walletIcon,
    walletTypeWalletConnect,
    isMini,
    liRef,
    isOpenSearch,
    selectedWallet,
  ])

  const refresh = async () => {
    const { getWalletDescriptors, getDefaultWalletFor } = await initBGFunctions(browser)
    const descriptors = await getWalletDescriptors()
    const selectedWallet = await getDefaultWalletFor(
      DefaultSigners.EXTENSION,
      ChainTypes.ETHEREUM_GOERLI
    )

    setSelectedWallet(selectedWallet)
    setSelectWallet(selectedWallet)

    setDescriptors(descriptors)
    !isOpen && !isOpenSearch && setOpenWalletMini()
    if (descriptors.length > 0) {
      const connectedDescriptors = descriptors.filter((x) => x.connected)

      if (connectedDescriptors.length > 0) {
        const newDescriptors = connectedDescriptors?.find((x) => x.type === selectedWallet)
        setConnectedDescriptors(connectedDescriptors)
        if (!newDescriptors) return
        const newWalletImage = makeBlockie(newDescriptors.account)
        setWalletImage(newWalletImage)
        if (newDescriptors.type === 'near') {
          setWalletAccount(newDescriptors.account)
        } else {
          setWalletAccount(newVisible(newDescriptors.account))
        }
        if (newDescriptors.type !== 'dapplets') {
          setWalletIcon(newDescriptors.meta.icon)
        } else {
          setWalletIcon(walletIcons[newDescriptors.type])
        }
        if (selectedWallet === 'walletconnect') {
          setWalletTypeWalletConnect(walletIcons[newDescriptors.type])
        } else {
          setWalletTypeWalletConnect(null)
        }
      } else {
        setWalletImage(null)
        setWalletAccount(null)
        setWalletIcon(null)
        setWalletTypeWalletConnect(null)
      }
    }
  }

  const disconnectButtonClick = async (chain: ChainTypes, wallet: WalletTypes) => {
    const { disconnectWallet } = await initBGFunctions(browser)
    await disconnectWallet(chain, wallet)
    await refresh()
  }
  const connectWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    try {
      if (isOverlay) {
        setOpen()
        await pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)

        setOpen()
      } else {
        setOpen()
        pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)

        setOpen()
      }
    } catch (error) {
    } finally {
      await refresh()
    }
  }
  const animation = useMemo(() => {
    const animeRef = anime({
      targets: liRef.current,
      scale: () => {
        if (isMini === true || isOpenSearch) {
          return ['0', '0']
        } else if (isMini === false) {
          return ['0', '1']
        }
      },
      duration: 300,
    })
  }, [liRef, isMini, isOpenSearch])

  return (
    <div className={cn(styles.wrapper, { [styles.mini]: isMini })}>
      <header
        className={cn(styles.header, {
          [styles.mini]: isMini || isOpenSearch,
        })}
        onClick={() => {
          setOpen()
        }}
      >
        {walletImage ? (
          <img
            src={walletImage}
            className={styles.avatar}
            onClick={() => {
              setOpen()
            }}
          />
        ) : (
          <div
            className={styles.avatar}
            onClick={() => {
              setOpen()
            }}
          >
            <Card />
          </div>
        )}

        <div
          className={cn(styles.wrapperNames, {
            [styles.wrapperNamesMini]: isMini || isOpenSearch,
          })}
          ref={liRef}
        >
          {walletAccount ? (
            <p style={{ fontSize: '12px' }} className={styles.hash}>
              {walletAccount}
            </p>
          ) : (
            <p style={{ fontSize: '12px', textTransform: 'uppercase' }} className={styles.hash}>
              wallets
            </p>
          )}
          {walletAccount && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '5px',
              }}
            >
              {walletTypeWalletConnect ? (
                <img className={styles.walletsIcon} src={walletTypeWalletConnect} alt="" />
              ) : null}
              {walletIcon ? <img className={styles.walletsIcon} src={walletIcon} alt="" /> : null}
            </div>
          )}
        </div>
      </header>

      <ModalLogin
        visible={isOpen}
        disconnectButtonClick={disconnectButtonClick}
        wallets={connectedDescriptors}
        selectedWallet={selectedWallet}
        onClose={setOpen}
        connectWallet={connectWallet} // isEveryWalletConnected ? null : connectWallet
        refresh={refresh}
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
