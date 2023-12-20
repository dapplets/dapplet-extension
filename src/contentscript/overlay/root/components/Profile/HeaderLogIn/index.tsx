// import anime from 'animejs'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { FC, useEffect, /*useMemo,*/ useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../../common/global-event-bus'
import * as walletIcons from '../../../../../../common/resources/wallets'
import {
  ChainTypes,
  DefaultSigners,
  WalletDescriptor,
  WalletTypes,
} from '../../../../../../common/types'
import { ReactComponent as Card } from '../../../assets/svg/card.svg'
import { truncateEthAddress } from '../../../helpers/truncateEthAddress'
import { Wallet } from '../../../pages/Wallet'
import { Modal as ModalWallet } from '../../Modal'
import { ModalLogin } from '../ModalLogin'
import styles from './HeaderLogIn.module.scss'

export interface HeaderLogInProps {
  isMini: boolean
  setOpen: () => void
  isOpen: boolean
  newProfile
  isOverlay: boolean
  setOpenWalletMini: () => void
  // isOpenSearch: boolean
  setConnectedDescriptors: (x: []) => void
  setSelectWallet: (x: string) => void
}

export const HeaderLogIn: FC<HeaderLogInProps> = (props: HeaderLogInProps) => {
  const {
    isMini,
    setOpen,
    isOpen,
    // newProfile,
    isOverlay,
    setOpenWalletMini,
    // isOpenSearch,
    setConnectedDescriptors,
    setSelectWallet,
  } = props

  const [descriptors, setDescriptors] = useState<WalletDescriptor[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const connectedDescriptors = descriptors.filter((x) => x.connected)
  // const [isModal, setModal] = useState(false)
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
  const [devMode, setMode] = useState(false)
  // const isEveryWalletConnected = descriptors.filter((x) => !x.connected).length === 0

  useEffect(() => {
    const init = async () => {
      await refresh()
    }

    init()
  }, [])

  useEffect(() => {
    EventBus.on('wallet_changed', refresh)

    return () => {
      EventBus.off('wallet_changed', refresh)
    }
  }, [])

  useEffect(() => {
    // EventBus.emit('dev_mod_changed')
    EventBus.on('dev_mod_changed', refresh)

    return () => {
      EventBus.off('dev_mod_changed', refresh)
    }
  }, [])

  const loadDevMode = async () => {
    const { getDevMode } = await initBGFunctions(browser)
    const devMode = await getDevMode()

    setMode(devMode)
  }

  const refresh = async () => {
    const { getWalletDescriptors, getDefaultWalletFor } = await initBGFunctions(browser)
    const descriptorsRefresh = await getWalletDescriptors()
    const selectedWallet = await getDefaultWalletFor(
      DefaultSigners.EXTENSION,
      ChainTypes.ETHEREUM_SEPOLIA
    )

    setSelectedWallet(selectedWallet)
    setSelectWallet(selectedWallet)

    setDescriptors(descriptorsRefresh)
    !isOpen &&
      // && !isOpenSearch
      setOpenWalletMini()
    if (descriptorsRefresh.length > 0) {
      const connectedDescriptors = descriptorsRefresh.filter((x) => x.connected)

      if (connectedDescriptors.length > 0) {
        const newDescriptors = connectedDescriptors?.find((x) => x.type === selectedWallet)
        setConnectedDescriptors(connectedDescriptors)

        if (!newDescriptors) {
          setWalletImage(null)
          setWalletAccount(null)
          setWalletIcon(null)
          setWalletTypeWalletConnect(null)
          return
        }
        const newWalletImage = newDescriptors.account && makeBlockie(newDescriptors.account)
        setWalletImage(newWalletImage)
        setWalletIcon(newDescriptors.meta.icon)

        if (newDescriptors.type === 'near') {
          setWalletAccount(newDescriptors.account)
        } else {
          setWalletAccount(newDescriptors.account && truncateEthAddress(newDescriptors.account))
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
    await loadDevMode()
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
      console.log(error)
    } finally {
      await refresh()
    }
  }

  // const animation = useMemo(() => {
  //   const animeRef = anime({
  //     targets: liRef.current,
  //     scale: () => {
  //       if (
  //         isMini === true
  //         // || isOpenSearch
  //       ) {
  //         return ['0', '0']
  //       } else if (isMini === false) {
  //         return ['0', '1']
  //       }
  //     },
  //     duration: 300,
  //   })
  // }, [
  //   liRef,
  //   isMini,
  //   //  isOpenSearch
  // ])

  return (
    <div className={cn(styles.wrapper, { [styles.mini]: isMini })} data-testid="profile-widget">
      <header
        className={cn(styles.header, {
          [styles.mini]: isMini,
          // || isOpenSearch,
        })}
        onClick={() => {
          setOpen()
        }}
      >
        {/* connectedDescriptors && connectedDescriptors.length > 0 && !selectedWallet */}
        {walletImage ? (
          <img
            src={walletImage}
            className={styles.avatar}
            onClick={() => {
              setOpen()
            }}
          />
        ) : connectedDescriptors && connectedDescriptors.length > 0 && !selectedWallet ? (
          <img
            src={makeBlockie(connectedDescriptors[0].account)}
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
            [styles.wrapperNamesMini]: isMini,
            // || isOpenSearch,
          })}
          ref={liRef}
        >
          {walletAccount ? (
            <p style={{ fontSize: '12px' }} className={styles.hash}>
              {walletAccount}
            </p>
          ) : connectedDescriptors && connectedDescriptors.length > 0 && !selectedWallet ? (
            <p style={{ fontSize: '12px' }} className={styles.hash}>
              {truncateEthAddress(connectedDescriptors[0].account)}
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

          {connectedDescriptors && connectedDescriptors.length > 0 && !selectedWallet ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '5px',
              }}
            >
              <img className={styles.walletsIcon} src={connectedDescriptors[0].meta.icon} alt="" />
            </div>
          ) : null}
        </div>
      </header>

      <ModalLogin
        descriptors={descriptors}
        visible={isOpen}
        disconnectButtonClick={disconnectButtonClick}
        wallets={connectedDescriptors}
        selectedWallet={selectedWallet}
        onClose={setOpen}
        connectWallet={connectWallet} // isEveryWalletConnected ? null : connectWallet
        refresh={refresh}
        devMode={devMode}
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
