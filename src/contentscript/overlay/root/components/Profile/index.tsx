import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { useToggle } from '../../hooks/useToggle'
import { HeaderLogIn } from './HeaderLogIn'
import { LogInButton } from './LoginButtons'
import { Modal } from './ModalConnectedAccounts'
import styles from './Profile.module.scss'
import test_acc_one from './profileIcons/Profile/profileOne.svg'
import test_acc_two from './profileIcons/Profile/profileTwo.svg'

export interface ProfileProps {
  avatar?: string
  hash?: string
}
// let uniqId = Math.floor(Math.random() * 1_000_000)
export const TEST_WALLET = [
  { id: 0, title: 'ENS' },
  { id: 1, title: 'NOT_ENS' },
]
export const TEST_ACCOUNT = [
  { id: 0, title: 'ENS_ACC', img: test_acc_one },
  { id: 1, title: 'NOT_ENS_ACC', img: test_acc_two },
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
  const [isModalWalletConnectProfile, setModalWalletConnectProfile] = useState(false)
  const [isMini, setMini] = useToggle(false)
  const [isEns, setEns] = useState(false)

  const [isModalWantLink, setModalWantLink] = useState(false)
  const [isModalWaitTransaction, setModalWaitTransaction] = useState(false)
  const [isModalPost, setModalPost] = useState(false)
  const [isModalPostLink, setModalPostLink] = useState(false)
  const [isModalFinalConnect, setModalFinalConnect] = useState(false)

  const onCloseModalWalletConnect = () => setModalWalletConnect(false)
  const onCloseModalWalletConnectProfile = () => setModalWalletConnectProfile(false)

  const onCloseModalWantLink = () => setModalWantLink(false)
  const onCloseModalWaitTransaction = () => setModalWaitTransaction(false)
  const onCloseModalPost = () => setModalPost(false)
  const onCloseModalPostLink = () => setModalPostLink(false)
  const onCloseModalFinalConnect = () => setModalFinalConnect(false)

  const [newProfile, setNewProfile] = useState([])
  useEffect(() => {}, [isNotLogIn, isModalWalletConnect, newProfile])

  const addConnectNewProfile = (i: number) => {
    const pushForm = Object.assign({}, TEST_ACCOUNT[i])

    newProfile.push(pushForm)
    setNewProfile(newProfile)
    console.log(newProfile, 'add')
  }

  const temporaryOpenModalTransaction = () => {
    setModalWantLink(false)
    setModalWaitTransaction(true)
    setTimeout(() => {
      onCloseModalWaitTransaction()
      setModalPost(true)
    }, 5000)
  }

  return (
    <>
      {isNotLogIn ? (
        <LogInButton label="Login" onClick={() => setModalWalletConnect(true)} />
      ) : (
        <>
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
            setModalWalletConnect={setModalWalletConnectProfile}
            newProfile={newProfile}
            setNewProfile={setNewProfile}
            isNotLogin={isNotLogIn}
            // onDeleteChildConnectNewProfile={onDeleteChildConnectNewProfile}
          />
        </>
      )}
      <Modal
        visible={isModalWalletConnect}
        title="Connect new wallet"
        content={'select connection type '}
        footer={
          <div className={cn(styles.wrapperModalWallets)}>
            {TEST_WALLET.map((x, i) => (
              <div
                key={i}
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
      <Modal
        visible={isModalWalletConnectProfile}
        title="Connect new wallet"
        content={'select connection type '}
        footer={
          <div className={cn(styles.wrapperModalWallets)}>
            {TEST_WALLET.map((x, i) => (
              <div
                key={i}
                className={cn(styles.walletBlock, {
                  [styles.ens]: x.title === 'ENS',
                })}
                onClick={() => {
                  // setNotLogIn(false)

                  addConnectNewProfile(i)
                  setOpen()
                  setMini()
                  setTimeout(() => onCloseModalWalletConnectProfile(), 500)

                  // x.title === 'ENS' ? setEns(true) : setEns(false)
                }}
              ></div>
            ))}
          </div>
        }
        onClose={() => onCloseModalWalletConnectProfile()}
      />
      <LogInButton
        onClick={() => setModalWantLink(true)}
        label="Modal"
        style={{ marginLeft: '20px' }}
      />
      <Modal
        visible={isModalWantLink}
        classNameWrapper={styles.contentModal}
        title="Want to link your accounts?"
        content={'You can link your Twitter account with your wallet'}
        footer={
          <div className={cn(styles.wrapperModalWantLink)}>
            {TEST_ACCOUNT.map((x, i) => (
              <div key={i} className={cn(styles.blockModalModalWantLink)}>
                <img src={x.img} className={cn(styles.imgModalModalWantLink)} />
                <p className={cn(styles.nameModalModalWantLink)}>{x.title}</p>
              </div>
            ))}
            <button
              onClick={() => {
                onCloseModalWantLink()
                temporaryOpenModalTransaction()
              }}
              className={cn(styles.buttonModalModalWantLink)}
            >
              Link
            </button>
          </div>
        }
        onClose={() => onCloseModalWantLink()}
      />
      <Modal
        visible={isModalWaitTransaction}
        classNameWrapper={styles.contentModal}
        title="Metamask message"
        content={'Please confirm your transaction to generate a message'}
        footer={''}
        onClose={() => onCloseModalWaitTransaction()}
      />
      <Modal
        visible={isModalPost}
        classNameWrapper={styles.contentModal}
        title="Post the message on Twitter"
        content={'Copy the message and post it on Twitter'}
        footer={
          <div className={styles.wrapperModalWantLink}>
            <div className={styles.postBlock}>
              <div className={styles.postInput}>
                Тут будет непосредственно текст который генерируется с помощью метамаска
              </div>
            </div>
            <a className={styles.postLinkCopy}>copy text</a>
            <button
              onClick={() => {
                onCloseModalPost()
                setModalPostLink(true)
              }}
              className={cn(styles.buttonModalModalWantLink)}
              // className={styles.postLinkPublished}
            >
              Posted
            </button>
          </div>
        }
        onClose={() => onCloseModalPost()}
      />
      <Modal
        visible={isModalPostLink}
        classNameWrapper={styles.contentModal}
        title="Twitter post link"
        content={'Add a link to the Twitter post to complete the verification'}
        footer={
          <div className={styles.postLinkWrapper}>
            <div className={styles.postBlock}>
              <input placeholder="post link" className={styles.postLinkInput}></input>
            </div>

            <button
              onClick={() => {
                onCloseModalPostLink()
                setModalFinalConnect(true)
              }}
              className={cn(styles.buttonModalModalWantLink, styles.newMargin)}
            >
              Done
            </button>
          </div>
        }
        onClose={() => onCloseModalPostLink()}
      />
      <Modal
        visible={isModalFinalConnect}
        title="Linking accounts"
        content={'This can take some time'}
        classNameWrapper={styles.contentModal}
        footer={
          <div className={cn(styles.wrapperModalWantLink)}>
            {TEST_ACCOUNT.map((x, i) => (
              <div key={i} className={cn(styles.blockModalModalWantLink)}>
                <img src={x.img} className={cn(styles.imgModalModalWantLink)} />
                <p className={cn(styles.nameModalModalWantLink)}>{x.title}</p>
              </div>
            ))}
            <button
              onClick={() => onCloseModalFinalConnect()}
              className={cn(styles.buttonModalModalWantLink)}
            >
              Confirm
            </button>
          </div>
        }
        onClose={() => onCloseModalFinalConnect()}
      />
    </>
  )
}
