import React, { FC } from 'react'
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
            isOverlay={isOverlay}
            setOpenWalletMini={setOpenWalletMini}
            // isOpenSearch={isOpenSearch}
          />
        </>
      )}
    </>
  )
}
