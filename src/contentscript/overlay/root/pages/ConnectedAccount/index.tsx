import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { Message } from '../../components/Message'
import { Modal } from '../../components/Profile/ModalConnectedAccounts'
import styles from './ConnectedAccount.module.scss'
import Attention from './testProfile/attention.svg'
import Ok from './testProfile/ok.svg'
import UserTest_1 from './testProfile/testUser_1.svg'
import UserTest_2 from './testProfile/testUser_2.svg'
import Time from './testProfile/Time.svg'

export interface ConnectedAccountProps {}
enum Status {
  Processing = 'Processing',
  Connected = 'Connected',
  Error = 'Error',
}
export const TEST_PROFILE = [
  {
    id: '0',
    userTestOne: { img: UserTest_1, name: '@Twitter', userActive: false, accountActive: false },
    userTestTwo: {
      img: UserTest_2,
      name: '0xB6fa...B8ad',
      userActive: false,
      accountActive: false,
    },
    statusName: Status.Connected,
    statusLabel: Ok,
    statusMessage: 'Status connected',
    userActive: false,
  },
  {
    id: '1',
    userTestOne: { img: UserTest_1, name: '@Twitter', userActive: false, accountActive: false },
    userTestTwo: {
      img: UserTest_2,
      name: '0xB6fa...B8ad',
      userActive: false,
      accountActive: false,
    },
    statusName: Status.Processing,
    statusLabel: Time,
    statusMessage: 'Status processing',
    userActive: false,
  },
  {
    id: '2',
    userTestOne: { img: UserTest_1, name: '@Twitter', userActive: false, accountActive: false },
    userTestTwo: {
      img: UserTest_2,
      name: '0xB6fa...B8ad',
      userActive: false,
      accountActive: false,
    },
    statusName: Status.Error,
    statusLabel: Attention,
    statusMessage: 'Status error',
    userActive: false,
  },
]
export const ConnectedAccount: FC<ConnectedAccountProps> = (props: ConnectedAccountProps) => {
  const [activeStatus, setActiveStatus] = useState<Status>(null)
  // const [isActiveChoiseButton, setActiveChoiseButton] = useState(false)
  const [isDisabledButtonChoise, setDisabledButtonChoise] = useState(false)

  const [isModalWaitTransaction, setModalWaitTransaction] = useState(false)
  const onCloseModalWaitTransaction = () => setModalWaitTransaction(false)

  const [isModalDeleteMainAccount, setModalDeleteMainAccount] = useState(false)
  const onCloseModalModalDeleteMainAccount = () => setModalDeleteMainAccount(false)

  const [activeId, setActiveId] = useState(null)
  useEffect(() => {}, [TEST_PROFILE])

  const temporaryOpenModalTransaction = () => {
    setModalWaitTransaction(true)
    setTimeout(() => {
      onCloseModalWaitTransaction()
    }, 5000)
  }

  const onDeleteChildRecepient = (id: number) => {
    setModalWaitTransaction(true)
    TEST_PROFILE.splice(id, 1)
    setTimeout(() => {
      onCloseModalWaitTransaction()
    }, 5000)

    // setItemsRecepient(newForm)
  }

  return (
    <div className={cn(styles.wrapper)}>
      <div className={styles.title}>
        <h3 className={styles.titleAccount}>Account</h3>
        <h3 className={styles.titleStatus}>Status</h3>
      </div>
      {TEST_PROFILE.length === 0 ? (
        <Message
          className={styles.messageDelete}
          title={'There are no connected accounts'}
          subtitle={'You can connect an account if you go to the appropriate URL'}
        />
      ) : (
        <div className={styles.accountsWrapper}>
          {TEST_PROFILE.map((x, i) => {
            return (
              <div key={i} className={styles.mainBlock}>
                <div className={styles.accountBlock}>
                  <div
                    className={cn(styles.account, styles.accountFirst, {
                      [styles.nameUserActive]: x.userTestOne.accountActive,
                    })}
                  >
                    <img src={x.userTestOne.img} className={styles.imgUser} />
                    <h4 className={cn(styles.nameUser)}>{x.userTestOne.name}</h4>
                    <button
                      disabled={isDisabledButtonChoise}
                      onClick={() => {
                        x.userTestOne.userActive = true
                        setDisabledButtonChoise(true)
                      }}
                      className={styles.accountButton}
                      type="button"
                    />
                    {x.userTestOne.userActive && (
                      <div className={styles.choiseUserActive}>
                        <button
                          onClick={() => {
                            x.userTestOne.userActive = false
                            setDisabledButtonChoise(false)
                          }}
                          className={cn(styles.accountButton, styles.accountButtonChoise)}
                        />
                        <div className={styles.blockLinkChoise}>
                          <a
                            onClick={() => {
                              temporaryOpenModalTransaction()
                              x.userTestOne.userActive = false
                              setDisabledButtonChoise(false)
                              setTimeout(() => {
                                x.userTestOne.accountActive = true
                              }, 4000)
                            }}
                            className={styles.linkChoise}
                          >
                            Use as an alias
                          </a>
                          <a
                            onClick={() => {
                              temporaryOpenModalTransaction()
                              x.userTestOne.userActive = false
                              setDisabledButtonChoise(false)
                              setTimeout(() => {
                                x.userTestOne.accountActive = false
                              }, 4000)
                            }}
                            className={styles.linkChoise}
                          >
                            Disconnect
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={styles.arrowsAccount}></span>
                  <div
                    className={cn(styles.account, styles.accountSecond, {
                      // [styles.nameUserActive]: x.id,
                    })}
                  >
                    <img src={x.userTestTwo.img} className={styles.imgUser} />
                    <h4 className={cn(styles.nameUser)}>{x.userTestTwo.name}</h4>
                    <button
                      disabled={isDisabledButtonChoise}
                      onClick={() => {
                        x.userTestTwo.userActive = true
                        setDisabledButtonChoise(true)
                      }}
                      className={styles.accountButton}
                      type="button"
                    />
                    {x.userTestTwo.userActive && (
                      <div className={styles.choiseUserActive}>
                        <button
                          onClick={() => {
                            x.userTestTwo.userActive = false
                            setDisabledButtonChoise(false)
                          }}
                          className={cn(styles.accountButton, styles.accountButtonChoise)}
                        />
                        <div className={styles.blockLinkChoise}>
                          <a
                            onClick={() => {
                              temporaryOpenModalTransaction()
                              x.userTestTwo.userActive = false
                              setDisabledButtonChoise(false)
                              // setActiveId(x.id)
                            }}
                            className={styles.linkChoise}
                          >
                            Use as an alias
                          </a>
                          <a className={styles.linkChoise}> Disconnect</a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div data-title={x.statusMessage} className={cn(styles.accountStatus)}>
                  <img
                    src={x.statusLabel}
                    className={cn(styles.statusLabel, {
                      [styles.statusConnected]: x.statusName === Status.Connected,
                      [styles.statusProcessing]: x.statusName === Status.Processing,
                      [styles.statusError]: x.statusName === Status.Error,
                    })}
                    alt={x.statusMessage}
                  />
                  <span className={styles.statusName}>{x.statusName}</span>
                </div>
                <div className={cn(styles.accountDelete)}>
                  <button
                    type="button"
                    onClick={() => {
                      if (x.userTestOne.accountActive === true) {
                        setActiveId(i)
                        setModalDeleteMainAccount(true)
                      } else {
                        onDeleteChildRecepient(i)
                      }
                    }}
                    className={styles.buttonDelete}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Modal
        visible={isModalDeleteMainAccount}
        classNameWrapper={styles.contentModal}
        title="Want to delete your alias?"
        content={'By removing this account you will also delete your alias'}
        footer={
          <div className={styles.wrapperModalWantLink}>
            <a onClick={() => onCloseModalModalDeleteMainAccount()} className={styles.postLinkCopy}>
              Cancel
            </a>
            <button
              onClick={() => {
                onDeleteChildRecepient(activeId)
                onCloseModalModalDeleteMainAccount()
              }}
              className={cn(styles.buttonModalModalWantLink)}
              // className={styles.postLinkPublished}
            >
              Delete anyway
            </button>
          </div>
        }
        onClose={() => onCloseModalModalDeleteMainAccount()}
      />
      <Modal
        visible={isModalWaitTransaction}
        classNameWrapper={styles.contentModal}
        title="Metamask message"
        content={'confirm the transaction to set your alias'}
        footer={''}
        onClose={() => onCloseModalWaitTransaction()}
      />
    </div>
  )
}
