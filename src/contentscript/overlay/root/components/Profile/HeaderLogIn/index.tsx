import cn from 'classnames'
import React, { FC, useEffect, useMemo, useRef } from 'react'
import { Avatar } from '../../Avatar'
import styles from './HeaderLogIn.module.scss'

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
  setEns: (x: boolean) => void
  setModalWalletConnect: (x: boolean) => void
  newProfile: any
  setNewProfile: (x: any) => void
  // onDeleteChildConnectNewProfile: (x: any) => void
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
    newProfile,
    setNewProfile,
    // onDeleteChildConnectNewProfile,
  } = props
  const modalRef = useRef<HTMLInputElement>()

  useEffect(() => {
    // window.addEventListener('click', handleClick)
    // return () => {
    //   window.removeEventListener('click', handleClick)
    // }
  }, [
    isOpen,
    isMini,
    isEns,
    newProfile,
    //  isNotLogin
  ])
  // const handleClick = (event) => {
  //   if (event.target !== modalRef.current) {
  //     setOpen()
  //     setMini()
  //     // console.log('lala')
  //   }
  // }
  const onDeleteChildConnectNewProfile = (id: any) => {
    newProfile.splice(id, 1)

    setNewProfile(newProfile.splice(id, 1))
    // console.log(newProfile, 'del')
    return newProfile
  }
  const filteredDapplets = useMemo(() => {
    return newProfile
  }, [newProfile])

  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 5)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }
  // console.log(filteredDapplets)

  const handleBlur = (e) => {
    const currentTarget = e.currentTarget

    // Check the newly focused element in the next tick of the event loop
    setTimeout(() => {
      // Check if the new activeElement is a child of the original container
      if (!currentTarget.contains(document.activeElement)) {
        // You can invoke a callback or add custom logic here
        setOpen()
        setMini()
        // console.log('lala')
      }
    }, 0)
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
          <Avatar
            avatar={avatar}
            size="big"
            className={styles.avatar}
            onClick={() => {
              setOpen()
              setMini()
            }}
          />
          <div
            tabIndex={0}
            // ref={modalRef}
            // tabIndex={1}
            // onBlur={() => {
            //   setOpen()
            //   setMini()
            // }}
            // tabIndex={-1}
            onBlur={handleBlur}
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
              {filteredDapplets &&
                filteredDapplets.map((x, i) => (
                  <div key={i} className={styles.newProfileBlock}>
                    <div className={styles.newProfileBlockInfo}>
                      <img className={styles.newProfileBlockImg} src={x.img} />
                      <p className={styles.newProfileBlockName}>{x.title}</p>
                    </div>
                    <button
                      onClick={() => {
                        onDeleteChildConnectNewProfile(i)
                        // setNewProfile(newProfile)
                      }}
                      className={styles.profileImgButton}
                    />
                  </div>
                ))}
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
