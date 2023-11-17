import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { useState } from 'react'
import browser from 'webextension-polyfill'
import * as walletIcons from '../../../../../../common/resources/wallets'
import { DefaultSigners, WalletDescriptor } from '../../../../../../common/types'
// import { ReactComponent as Copy } from '../../../assets/svg/copyModal.svg'
import { ReactComponent as Disconnect } from '../../../assets/svg/unlink.svg'
import { ReactComponent as WalletImg } from '../../../assets/svg/wallet.svg'
import { truncateEthAddress } from '../../../helpers/truncateEthAddress'
import useCopied from '../../../hooks/useCopyed'
import styles from './Modal.module.scss'

interface ModalLoginProps {
  visible: boolean
  onClose?: () => void
  wallets: WalletDescriptor[]
  selectedWallet: string
  disconnectButtonClick: (x: any, y: any) => void
  connectWallet?: () => void
  refresh?: () => void
  descriptors: WalletDescriptor[]
  devMode: boolean
}

export const ModalLogin = ({
  visible = false,
  onClose,
  wallets,
  selectedWallet,
  disconnectButtonClick,
  connectWallet,
  refresh,
  descriptors,
  devMode,
}: ModalLoginProps) => {
  const [isNotVisible, setNotVisible] = useState(false)
  const [value, setValue] = useState('')
  const [, copy] = useCopied(value)

  // ToDo: Escape was commented to fix DAP-3769. Restore this feature or remove completely
  // const onKeydown = ({ key }: KeyboardEvent) => {
  //   switch (key) {
  //     case 'Escape':
  //       setNotVisible(true)
  //       setTimeout(() => {
  //         setNotVisible(false)
  //         onClose()
  //         refresh()
  //       }, 300)
  //       break
  //   }
  // }

  // useEffect(() => {
  //   document.addEventListener('keydown', onKeydown)
  //   return () => {
  //     document.removeEventListener('keydown', onKeydown)
  //   }
  // })

  if (!visible) return null

  const handleWalletClick = async (wallet: WalletDescriptor) => {
    const { setWalletFor } = await initBGFunctions(browser)
    await setWalletFor(wallet.type, DefaultSigners.EXTENSION, wallet.chain)
    refresh()
  }

  const selectedWalletDescriptor = selectedWallet
    ? wallets.find((x) => x.type === selectedWallet)
    : null

  return (
    <div
      data-testid="profile-modal-login"
      onClick={() => {
        setNotVisible(true)
        setTimeout(() => {
          setNotVisible(false)
          onClose()
          refresh()
        }, 200)
      }}
      className={cn(styles.fakeModal)}
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
              {selectedWalletDescriptor && selectedWalletDescriptor.account ? (
                <img
                  src={
                    selectedWalletDescriptor.account &&
                    makeBlockie(selectedWalletDescriptor.account)
                  }
                  className={styles.profileImg}
                />
              ) : (
                <WalletImg />
              )}
            </span>
          </div>

          <p className={styles.notEnsHash}>
            {selectedWalletDescriptor?.account
              ? truncateEthAddress(selectedWalletDescriptor?.account)
              : 'Wallets'}
          </p>
        </div>
        <div className={styles.walletBlock}>
          {wallets &&
            wallets.map((x, i) => (
              // ToDo: Attention! Hardcoded values! Move all mentions x.type.includes('near') from the UI-layer
              <div
                key={i}
                className={cn(styles.newProfileBlock, {
                  [styles.noHover]: !devMode || x.type.includes('near'),
                })}
              >
                <div
                  onClick={() => {
                    devMode && !x.type.includes('near')
                      ? handleWalletClick(x)
                      : devMode && x.type.includes('near')
                      ? null
                      : null
                  }}
                  className={cn(styles.newProfileBlockInfo, {
                    [styles.noHover]: !devMode || x.type.includes('near'),
                  })}
                >
                  {x.account ? (
                    <img
                      src={x.account && makeBlockie(x.account)}
                      className={styles.newProfileBlockImg}
                    />
                  ) : null}
                  {x.account ? (
                    <div className={styles.meta}>
                      {x.type !== 'near' ? (
                        <p title={x.account} className={styles.newProfileBlockName}>
                          {truncateEthAddress(x.account)}
                         
                        </p>
                      ) : (
                        <p title={x.account} className={styles.newProfileBlockNameNear}>
                          {x.account}
                         
                        </p>
                      )}

                      <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        {x.type === 'walletconnect' ? (
                          <img className={styles.walletsIcon} src={walletIcons[x.type]} alt="" />
                        ) : null}

                        <img className={styles.walletsIcon} src={x.meta.icon} alt="" />
                      </div>
                    </div>
                  ) : null}
                </div>
                {/* <div
                  onClick={() => {
                    setValue(x.account)
                    setTimeout(() => {
                      copy()
                    }, 500)
                  }}
                  className={styles.copy}
                >
                  <span>
                    <Copy />
                  </span>
                </div> */}
                <div className={styles.profileImgButtonBlock}>
                  <button
                    onClick={() => disconnectButtonClick(x.chain, x.type)}
                    className={styles.profileImgButton}
                  >
                    <Disconnect />
                  </button>
                </div>
              </div>
            ))}
          {connectWallet && wallets.length < descriptors.length && (
            <div
              className={styles.addWallet}
              onClick={connectWallet}
              data-testid="add-wallet-btn-profile-widget"
            >
              <span className={styles.AddUserLabel}>Add Wallet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
