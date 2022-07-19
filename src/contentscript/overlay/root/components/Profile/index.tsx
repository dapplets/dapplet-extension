import React, { FC, useEffect, useState } from 'react'
import { HeaderLogIn } from './HeaderLogIn'
import { LogInButton } from './LoginButtons'

export interface ProfileProps {
  avatar?: string
  hash?: string
  handleWalletConnect: () => void
  isWalletLength: boolean
  handleWalletLengthConnect: () => void
  isOverlay: boolean

  isMini: boolean
  setOpenWallet: () => void
  isOpenWallet: boolean
  setOpenWalletMini: () => void
  isOpenSearch: boolean
}

let _isMounted = false
export const Profile: FC<ProfileProps> = (props: ProfileProps) => {
  const {
    avatar,
    hash,
    handleWalletConnect,
    isWalletLength,
    isOverlay,
    isMini,
    setOpenWallet,
    isOpenWallet,
    setOpenWalletMini,
    isOpenSearch,
  } = props

  // If it is not used anywhere, delete it
  const [isModalWalletConnectProfile, setModalWalletConnectProfile] = useState(false)

  const [newProfile, setNewProfile] = useState([])
  useEffect(() => {
    const init = async () => {
      _isMounted = true
    }

    init()

    return () => {
      _isMounted = false
    }
  }, [newProfile, isMini])

  // Move the function from onClick to a separate one and pass it as a link
  return (
    <>
      {isWalletLength ? (
        <LogInButton label="Login" onClick={() => handleWalletConnect()} />
      ) : (
        <>
          <HeaderLogIn
            isMini={isMini}
            setOpen={setOpenWallet}
            isOpen={isOpenWallet}
            hash={hash}
            avatar={avatar}
            setModalWalletConnect={setModalWalletConnectProfile}
            newProfile={newProfile}
            isOverlay={isOverlay}
            setOpenWalletMini={setOpenWalletMini}
            isOpenSearch={isOpenSearch}
          />
        </>
      )}
    </>
  )
}
