import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as walletIcons from '../../../../../../common/resources/wallets'
import { DefaultSigners, WalletDescriptor } from '../../../../../../common/types'
import { ReactComponent as WalletImg } from '../../../assets/svg/wallet.svg'
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
}

export const ModalLogin = ({
  visible = false,
  onClose,
  wallets,
  selectedWallet,
  disconnectButtonClick,
  connectWallet,
  refresh,
}: ModalLoginProps) => {
  const [isNotVisible, setNotVisible] = useState(false)
  const [value, setValue] = useState('')
  const [, copy] = useCopied(value)

  const onKeydown = ({ key }: KeyboardEvent) => {
    switch (key) {
      case 'Escape':
        setNotVisible(true)
        setTimeout(() => {
          setNotVisible(false)
          onClose()
          refresh()
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

  if (!visible) return null

  const newVisible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)
    return `${firstFourCharacters}...${lastFourCharacters}`
  }

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
                  src={makeBlockie(selectedWalletDescriptor.account)}
                  className={styles.profileImg}
                />
              ) : (
                <WalletImg />
              )}
            </span>
          </div>

          <p className={styles.notEnsHash}>
            {selectedWalletDescriptor?.account
              ? newVisible(selectedWalletDescriptor?.account)
              : 'Wallets'}
          </p>
        </div>
        <div className={styles.walletBlock}>
          {wallets &&
            wallets.map((x, i) => (
              <div key={i} className={styles.newProfileBlock}>
                <div
                  onClick={() => {
                    handleWalletClick(x)
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

                      <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        {x.type === 'walletconnect' ? (
                          <img className={styles.walletsIcon} src={walletIcons[x.type]} alt="" />
                        ) : null}

                        {x.type === 'dapplets' ? (
                          <img className={styles.walletsIcon} src={walletIcons[x.type]} alt="" />
                        ) : (
                          <img className={styles.walletsIcon} src={x.meta.icon} alt="" />
                        )}
                      </div>
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
                wallets.length >= 5 ? null : connectWallet()
              }}
            >
              <span
                data-title={
                  wallets.length >= 5
                    ? 'All of your wallets are already connected Disconnect one of them to add a new one'
                    : null
                }
                className={cn(styles.AddUserLabel, {
                  [styles.addWalletsDisabled]: wallets.length >= 5,
                })}
              >
                Add Wallet
                {wallets.length >= 5 ? (
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
