import React, { FC, useEffect, useState } from 'react'
import { HeaderLogIn } from './HeaderLogIn'
import { LogInButton } from './LoginButtons'

export interface ProfileProps {
  handleWalletConnect: () => void
  isWalletLength: boolean
  handleWalletLengthConnect: () => void
  isOverlay: boolean

  isMini: boolean
  setOpenWallet: () => void
  isOpenWallet: boolean
  setOpenWalletMini: () => void
  setConnectedDescriptors: (x: []) => void
  setSelectedWallet: (x: string) => void
}

export const Profile: FC<ProfileProps> = (props: ProfileProps) => {
  const {
    handleWalletConnect,
    isWalletLength,
    isOverlay,
    isMini,
    setOpenWallet,
    isOpenWallet,
    setOpenWalletMini,
    setConnectedDescriptors,
    setSelectedWallet,
  } = props

  const [newProfile, setNewProfile] = useState([])
  useEffect(() => {
    const init = async () => {}

    init()

    return () => {}
  }, [])

  return (
    <>
      {isWalletLength ? (
        <LogInButton label="Login" onClick={() => handleWalletConnect()} />
      ) : (
        <>
          <HeaderLogIn
            setSelectWallet={setSelectedWallet}
            setConnectedDescriptors={setConnectedDescriptors}
            isMini={isMini}
            setOpen={setOpenWallet}
            isOpen={isOpenWallet}
            newProfile={newProfile}
            isOverlay={isOverlay}
            setOpenWalletMini={setOpenWalletMini}
            // isOpenSearch={isOpenSearch}
          />
        </>
      )}
    </>
  )
}
