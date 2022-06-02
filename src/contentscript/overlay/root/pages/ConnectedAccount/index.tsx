import cn from 'classnames'
import React, { FC, useState } from 'react'
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
    userTestOne: { img: UserTest_1, name: '@Twitter', userActive: false },
    userTestTwo: { img: UserTest_2, name: '0xB6fa...B8ad', userActive: false },
    statusName: Status.Connected,
    statusLabel: Ok,
    statusMessage: 'Status connected',
    // userActive: false,
  },
  {
    id: '1',
    userTestOne: { img: UserTest_1, name: '@Twitter', userActive: false },
    userTestTwo: { img: UserTest_2, name: '0xB6fa...B8ad', userActive: false },
    statusName: Status.Processing,
    statusLabel: Time,
    statusMessage: 'Status processing',
    // userActive: false,
  },
  {
    id: '2',
    userTestOne: { img: UserTest_1, name: '@Twitter', userActive: false },
    userTestTwo: { img: UserTest_2, name: '0xB6fa...B8ad', userActive: false },
    statusName: Status.Error,
    statusLabel: Attention,
    statusMessage: 'Status error',
    // userActive: false,
  },
]
export const ConnectedAccount: FC<ConnectedAccountProps> = (props: ConnectedAccountProps) => {
  const [activeStatus, setActiveStatus] = useState<Status>(null)
  // const [isActiveChoiseButton, setActiveChoiseButton] = useState(false)
  const [isDisabledButtonChoise, setDisabledButtonChoise] = useState(false)

  const [isModalWaitTransaction, setModalWaitTransaction] = useState(false)
  const onCloseModalWaitTransaction = () => setModalWaitTransaction(false)

  const [activeId, setActiveId] = useState(null)

  const temporaryOpenModalTransaction = () => {
    setModalWaitTransaction(true)
    setTimeout(() => {
      onCloseModalWaitTransaction()
    }, 5000)
  }

  return (
    <div className={cn(styles.wrapper)}>
      <div className={styles.title}>
        <h3 className={styles.titleAccount}>Account</h3>
        <h3 className={styles.titleStatus}>Status</h3>
      </div>
      <div className={styles.accountsWrapper}>
        {TEST_PROFILE.map((x, i) => {
          return (
            <div key={i} className={styles.mainBlock}>
              <div className={styles.accountBlock}>
                <div
                  className={cn(styles.account, styles.accountFirst, {
                    [styles.nameUserActive]: x.id,
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
                            setActiveId(x.id)
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
                <span className={styles.arrowsAccount}></span>
                <div
                  className={cn(styles.account, styles.accountSecond, {
                    [styles.nameUserActive]: x.id,
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
                            setActiveId(x.id)
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
                <button type="button" className={styles.buttonDelete} />
              </div>
            </div>
          )
        })}
      </div>
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
