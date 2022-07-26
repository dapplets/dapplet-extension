import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Message } from '../../components/Message'
import styles from './ConnectedAccount.module.scss'
import { Modal } from './ModalConnectedAccounts'
import Ok from './testProfile/ok.svg'

export interface ConnectedAccountProps {}
enum Status {
  Processing = 'Processing',
  Connected = 'Connected',
  Error = 'Error',
}

interface IUser {
  img: string
  name: string
  origin: string
  userActive: boolean
  accountActive: boolean
}

interface IPair {
  firstAccount: IUser
  secondAccount: IUser
  statusName: Status
  statusLabel: string // Ok | Time | Attention
  statusMessage: string
  userActive: boolean
  closeness: number
}

export const ConnectedAccount: FC<ConnectedAccountProps> = (props: ConnectedAccountProps) => {
  const [pairs, setPairs] = useState<IPair[]>()

  const [activeStatus, setActiveStatus] = useState<Status>(null)
  // const [isActiveChoiseButton, setActiveChoiseButton] = useState(false)
  const [isDisabledButtonChoise, setDisabledButtonChoise] = useState(false)

  const [isModalWaitTransaction, setModalWaitTransaction] = useState(false)
  const onCloseModalWaitTransaction = () => setModalWaitTransaction(false)

  const [isModalDeleteMainAccount, setModalDeleteMainAccount] = useState(false)
  const onCloseModalModalDeleteMainAccount = () => setModalDeleteMainAccount(false)

  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    const fn = async () => {
      const { getWalletDescriptors, getConnectedAccounts } = await initBGFunctions(browser)
      const descriptors: {
        account: string
        chain: string
        connected: boolean
      }[] = await getWalletDescriptors()
      console.log('descriptors', descriptors)
      const connectedDescriptors = descriptors.filter((d) => d.connected === true)
      if (!connectedDescriptors || connectedDescriptors.length === 0) return
      let newPairs: IPair[] = []
      for (const d of connectedDescriptors) {
        const firstAccount: IUser = {
          name: d.account,
          origin: d.chain,
          img: makeBlockie(d.account),
          userActive: false,
          accountActive: false,
        }
        const connectedAccounts: any[][] = await getConnectedAccounts(d.account, d.chain, null)
        console.log('connectedAccounts', connectedAccounts)
        connectedAccounts.forEach((level, i) =>
          level.forEach((ca) => {
            const [caName, caOrigin1, caOrigin2] = ca.id.split('/')
            newPairs.push({
              firstAccount,
              secondAccount: {
                name: caName,
                origin: caOrigin2 ? caOrigin1 + '/' + caOrigin2 : caOrigin1,
                img: makeBlockie(caName),
                userActive: false,
                accountActive: false,
              },
              statusName: Status.Connected,
              statusLabel: Ok,
              statusMessage: 'Connected',
              userActive: false,
              closeness: i + 1,
            })
          })
        )
      }
      setPairs(newPairs)
    }

    fn()
  }, [])

  const temporaryOpenModalTransaction = () => {
    // setModalWaitTransaction(true)
    // setTimeout(() => {
    //   onCloseModalWaitTransaction()
    // }, 5000)
  }

  const handleDisconnectAccounts = async (firstAccount: IUser, secondAccount: IUser) => {
    const { getMinStakeAmount, requestVerification } = await initBGFunctions(browser)
    const minStakeAmount = await getMinStakeAmount()
    const requestId = await requestVerification(
      {
        firstAccountId: firstAccount.name,
        firstOriginId: firstAccount.origin,
        secondAccountId: secondAccount.name,
        secondOriginId: secondAccount.origin,
        firstProofUrl:
          firstAccount.origin === 'twitter' // ToDo !!! Only for I stage of CA
            ? 'https://twitter.com/' + firstAccount.name
            : null,
        secondProofUrl:
          secondAccount.origin === 'twitter' // ToDo !!! Only for I stage of CA
            ? 'https://twitter.com/' + secondAccount.name
            : null,
        isUnlink: true,
      },
      minStakeAmount
    )
    console.log('requestId', requestId)

    // setModalWaitTransaction(true)
    // TEST_PROFILE.splice(id, 1)
    // setTimeout(() => {
    //   onCloseModalWaitTransaction()
    // }, 5000)
    // setItemsRecepient(newForm)
  }

  return (
    <div className={cn(styles.wrapper)}>
      <div className={styles.title}>
        <h3 className={styles.titleAccount}>Accounts</h3>
        <h3 className={styles.titleStatus}>Status</h3>
      </div>
      {!pairs || pairs.length === 0 ? (
        <Message
          className={styles.messageDelete}
          title={'There are no connected accounts'}
          subtitle={'Use Connecting Accounts dapplet to connect your accounts'}
        />
      ) : (
        <div className={styles.accountsWrapper}>
          {pairs.map((x, i) => {
            return (
              <div key={i} className={styles.mainBlock}>
                <div className={styles.accountBlock}>
                  <div
                    className={cn(styles.account, {
                      [styles.nameUserActive]: x.firstAccount.accountActive,
                    })}
                  >
                    <img src={x.firstAccount.img} className={styles.imgUser} />
                    <h4 className={styles.nameUser}>{x.firstAccount.name}</h4>
                    {/* <button
                      disabled={isDisabledButtonChoise}
                      onClick={() => {
                        x.firstAccount.userActive = true
                        setDisabledButtonChoise(true)
                      }}
                      className={styles.accountButton}
                      type="button"
                    /> */}
                    {/* {x.firstAccount.userActive && (
                      <div className={styles.choiseUserActive}>
                        <button
                          onClick={() => {
                            x.firstAccount.userActive = false
                            setDisabledButtonChoise(false)
                          }}
                          className={cn(styles.accountButton, styles.accountButtonChoise)}
                        />
                        <div className={styles.blockLinkChoise}>
                          <a
                            onClick={() => {
                              temporaryOpenModalTransaction()
                              x.firstAccount.userActive = false
                              setDisabledButtonChoise(false)
                              setTimeout(() => {
                                x.firstAccount.accountActive = true
                              }, 4000)
                            }}
                            className={styles.linkChoise}
                          >
                            Use as an alias
                          </a>
                          <a
                            onClick={() => {
                              temporaryOpenModalTransaction()
                              x.firstAccount.userActive = false
                              setDisabledButtonChoise(false)
                              setTimeout(() => {
                                x.firstAccount.accountActive = false
                              }, 4000)
                            }}
                            className={styles.linkChoise}
                          >
                            Disconnect
                          </a>
                        </div>
                      </div>
                    )} */}
                  </div>
                  <span className={styles.arrowsAccount}></span>
                  <div className={styles.account}>
                    <img src={x.secondAccount.img} className={styles.imgUser} />
                    <h4 className={styles.nameUser}>{x.secondAccount.name}</h4>
                    {/* <button
                      disabled={isDisabledButtonChoise}
                      onClick={() => {
                        x.secondAccount.userActive = true
                        setDisabledButtonChoise(true)
                      }}
                      className={styles.accountButton}
                      type="button"
                    /> */}
                    {/* {x.secondAccount.userActive && (
                      <div className={styles.choiseUserActive}>
                        <button
                          onClick={() => {
                            x.secondAccount.userActive = false
                            setDisabledButtonChoise(false)
                          }}
                          className={cn(styles.accountButton, styles.accountButtonChoise)}
                        />
                        <div className={styles.blockLinkChoise}>
                          <a
                            onClick={() => {
                              temporaryOpenModalTransaction()
                              x.secondAccount.userActive = false
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
                    )} */}
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
                  {/* <span className={styles.statusName}>{x.statusName}</span> */}
                </div>
                <div className={cn(styles.accountDelete)}>
                  <button
                    type="button"
                    onClick={() => {
                      if (x.firstAccount.accountActive === true) {
                        setActiveId(i)
                        setModalDeleteMainAccount(true)
                      } else {
                        handleDisconnectAccounts(x.firstAccount, x.secondAccount)
                      }
                    }}
                    className={styles.buttonDelete}
                    disabled={x.closeness > 1}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* <Modal
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
                handleDisconnectAccounts(activeId)
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
      /> */}
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
