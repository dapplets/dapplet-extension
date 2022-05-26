import React, { FC, useEffect } from 'react'
import styles from './Profile.module.scss'
import cn from 'classnames'
import { Avatar } from '../Avatar'
import { ReactComponent as Down } from '../../assets/icons/down.svg'
import { useToggle } from '../../hooks/useToggle'
import { useState } from 'react'
import { LogInButton } from './LoginButtons'
import { Modal } from './ModalConnectedAccounts'
import { HeaderLogIn } from './HeaderLogIn'

export interface ProfileProps {
  avatar?: string
  hash?: string
}
const TEST_WALLET = [
  { id: '1', title: 'ENS' },
  { id: '1', title: 'NOT_ENS' },
]

export const Profile: FC<ProfileProps> = (props: ProfileProps) => {
  const {
    avatar,
    hash,
    //  isOpen, onLogout, open, mini = false
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [isNotLogIn, setNotLogIn] = useState(true)
  const [isModalWalletConnect, setModalWalletConnect] = useState(false)
  const [isMini, setMini] = useToggle(false)
  const [isEns, setEns] = useState(false)

  const onCloseModalWalletConnect = () => setModalWalletConnect(false)
  useEffect(() => {
    console.log(isNotLogIn)
  }, [isNotLogIn])

  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 5)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  return (
    <>
      {isNotLogIn ? (
        <LogInButton
          label="Login"
          onClick={() => setModalWalletConnect(true)}
        />
      ) : (
        <HeaderLogIn
          isMini={isMini}
          setOpen={setOpen}
          setMini={setMini}
          isOpen={isOpen}
          setNotLogIn={setNotLogIn}
          hash={hash}
          avatar={avatar}
          isEns={isEns}
          setEns={setEns}
          // isNotLogin={isNotLogIn}
        />
      )}
      <Modal
        visible={isModalWalletConnect}
        title="Connect new wallet"
        content={'select connection type '}
        footer={
          <div className={cn(styles.wrapperModalWallets)}>
            {TEST_WALLET.map((x, i) => (
              <div
                className={cn(styles.walletBlock, {
                  [styles.ens]: x.title === 'ENS',
                })}
                onClick={() => {
                  setNotLogIn(false)
                  onCloseModalWalletConnect()
                  x.title === 'ENS' ? setEns(true) : setEns(false)
                }}
              ></div>
            ))}
          </div>
        }
        onClose={() => onCloseModalWalletConnect()}
      />
    </>
  )
}
