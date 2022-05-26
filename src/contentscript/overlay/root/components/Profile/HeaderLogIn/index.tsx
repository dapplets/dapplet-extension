import React, { FC, useEffect } from 'react'
import styles from './HeaderLogIn.module.scss'
import cn from 'classnames'
import { Avatar } from '../../Avatar'
import { ReactComponent as Down } from '../../../assets/icons/down.svg'

import { useState } from 'react'

export interface HeaderLogInProps {
  avatar?: string
  hash?: string
  isMini: boolean
  setOpen: () => void
  setMini: () => void
  isOpen: boolean
  setNotLogIn: (x: any) => void
  // isNotLogin: boolean
  isEns: boolean
  setEns: (x) => void
  setModalWalletConnect: (x: any) => void
}

export const HeaderLogIn: FC<HeaderLogInProps> = (props: HeaderLogInProps) => {
  const {
    avatar,
    hash,
    isMini,
    setOpen,
    setMini,
    isOpen,
    setNotLogIn,
    // isNotLogin,
    isEns,
    setEns,
    setModalWalletConnect,
  } = props

  useEffect(() => {}, [
    isOpen,
    isMini,
    isEns,
    //  isNotLogin
  ])

  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 5)

    return `${firstFourCharacters}...${lastFourCharacters}`
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
        <Avatar avatar={avatar} size="big" className={styles.avatar} />
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
          <Avatar avatar={avatar} size="big" className={styles.avatar} />
          <div
            onBlur={() => {
              setMini()
              setOpen()
            }}
            // tabIndex={-1}
            className={cn(styles.headerWrapperIsOpen, {
              [styles.isOpen]: isOpen,
            })}
          >
            <div className={styles.profileBlock}>
              <div className={styles.profileBlockImg}>
                <img className={styles.profileImg} src={avatar}></img>
                <button
                  onClick={() => {
                    setOpen()
                    setMini()
                  }}
                  className={styles.profileImgButton}
                />
              </div>
              {isEns ? (
                <>
                  <span className={styles.ensLabel}>ens</span>
                  <p className={styles.ensName}>UserENSName</p>
                  <p className={styles.ensHash}>{visible(hash)}</p>
                </>
              ) : (
                <p className={styles.notEnsHash}>{visible(hash)}</p>
              )}

              <a className={styles.profileLink}>Profile</a>
            </div>
            <div className={styles.walletBlock}>
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
