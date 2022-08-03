import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Message } from '../../components/Message'
import styles from './ConnectedAccount.module.scss'
// import { Modal } from './ModalConnectedAccounts'
import Attention from './testProfile/attention.svg'
import Ok from './testProfile/ok.svg'
import Time from './testProfile/time.svg'
import { IPair, IUser, Status, TAccount, TVerificationRequest } from './types'

export interface ConnectedAccountProps {}

export const ConnectedAccount: FC<ConnectedAccountProps> = (props: ConnectedAccountProps) => {
  const [pairs, setPairs] = useState<IPair[]>([])
  // const [isModalWaitTransaction, setModalWaitTransaction] = useState(false)
  // const onCloseModalWaitTransaction = () => setModalWaitTransaction(false)

  // const [activeStatus, setActiveStatus] = useState<Status>(null)
  // const [isActiveChoiseButton, setActiveChoiseButton] = useState(false)
  // const [isDisabledButtonChoise, setDisabledButtonChoise] = useState(false)

  // const [isModalDeleteMainAccount, setModalDeleteMainAccount] = useState(false)
  // const onCloseModalModalDeleteMainAccount = () => setModalDeleteMainAccount(false)

  // const [activeId, setActiveId] = useState(null)

  const setAllPairs = async (pendingIds: number[] = []) => {
    const {
      getWalletDescriptors,
      getConnectedAccounts,
      getPendingRequests,
      getVerificationRequest,
      getRequestStatus,
      getStatus,
    } = await initBGFunctions(browser)

    const descriptors: {
      account: string
      chain: string
      connected: boolean
    }[] = await getWalletDescriptors()

    // console.log('descriptors', descriptors)
    const connectedDescriptors = descriptors.filter((d) => d.connected === true)
    if (!connectedDescriptors || connectedDescriptors.length === 0) return

    let newPairs: IPair[] = []
    let processingAccountIdsPairs: [string, string][] = []
    let newPendingIds: number[] = []

    for (const d of connectedDescriptors) {
      const firstAccStatus: boolean = await getStatus(d.account, d.chain)
      const firstAccount: IUser = {
        name: d.account,
        origin: d.chain,
        img: makeBlockie(d.account),
        userActive: false,
        accountActive: firstAccStatus,
      }
      const globalId = d.account + '/' + d.chain

      // *** PENDING ***
      const pendingRequestsIds: number[] = await getPendingRequests()
      if (pendingRequestsIds && pendingRequestsIds.length > 0) {
        for (const pendingRequestId of pendingRequestsIds) {
          const verificationRequest: TVerificationRequest = await getVerificationRequest(
            pendingRequestId
          )
          // console.log('verificationRequest', verificationRequest)
          if (verificationRequest.firstAccount === globalId) {
            const [sName, sOrigin1, sOrigin2] = verificationRequest.secondAccount.split('/')
            const sOrigin = sOrigin2 ? sOrigin1 + '/' + sOrigin2 : sOrigin1
            const sAccStatus: boolean = await getStatus(sName, sOrigin)
            newPairs.push({
              firstAccount,
              secondAccount: {
                name: sName,
                origin: sOrigin,
                img: makeBlockie(sName),
                userActive: false,
                accountActive: sAccStatus,
              },
              statusName: Status.Processing,
              statusLabel: Time,
              statusMessage: 'Processing',
              userActive: false,
              closeness: 1,
            })
            processingAccountIdsPairs.push([globalId, verificationRequest.secondAccount])
            newPendingIds.push(pendingRequestId)
          } else if (verificationRequest.secondAccount === globalId) {
            const [fName, fOrigin1, fOrigin2] = verificationRequest.firstAccount.split('/')
            const fOrigin = fOrigin2 ? fOrigin1 + '/' + fOrigin2 : fOrigin1
            const fAccStatus: boolean = await getStatus(fName, fOrigin)
            newPairs.push({
              firstAccount,
              secondAccount: {
                name: fName,
                origin: fOrigin,
                img: makeBlockie(fName),
                userActive: false,
                accountActive: fAccStatus,
              },
              statusName: Status.Processing,
              statusLabel: Time,
              statusMessage: 'Processing',
              userActive: false,
              closeness: 1,
            })
            processingAccountIdsPairs.push([globalId, verificationRequest.firstAccount])
            newPendingIds.push(pendingRequestId)
          }
        }
      }

      // *** CONNECTED ***
      const connectedAccounts: TAccount[][] = await getConnectedAccounts(d.account, d.chain, null)
      // console.log('connectedAccounts', connectedAccounts)
      connectedAccounts.forEach((level, i) =>
        level.forEach((ca) => {
          if (hasEqualPair([globalId, ca.id], processingAccountIdsPairs)) return
          const [caName, caOrigin1, caOrigin2] = ca.id.split('/')
          newPairs.push({
            firstAccount,
            secondAccount: {
              name: caName,
              origin: caOrigin2 ? caOrigin1 + '/' + caOrigin2 : caOrigin1,
              img: makeBlockie(caName),
              userActive: false,
              accountActive: ca.status.isMain,
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

    // *** REJECTED ***

    // console.log('pendingIds', pendingIds)
    // console.log('newPendingIds', newPendingIds)
    const resolvedIds = pendingIds.filter((pendingId) => !newPendingIds.includes(pendingId))
    if (resolvedIds.length !== 0) {
      for (const resolvedId of resolvedIds) {
        const requestStatus: 'not found' | 'pending' | 'approved' | 'rejected' =
          await getRequestStatus(resolvedId)
        // console.log('requestStatus', requestStatus)
        if (requestStatus !== 'rejected') continue

        const verificationRequest: TVerificationRequest = await getVerificationRequest(resolvedId)
        // console.log('verificationRequest', verificationRequest)
        const [fName, fOrigin1, fOrigin2] = verificationRequest.firstAccount.split('/')
        const [sName, sOrigin1, sOrigin2] = verificationRequest.secondAccount.split('/')

        const fOrigin = fOrigin2 ? fOrigin1 + '/' + fOrigin2 : fOrigin1
        const fAccStatus: boolean = await getStatus(fName, fOrigin)
        const firstAccount: IUser = {
          name: fName,
          origin: fOrigin,
          img: makeBlockie(fName),
          userActive: false,
          accountActive: fAccStatus,
        }

        const sOrigin = sOrigin2 ? sOrigin1 + '/' + sOrigin2 : sOrigin1
        const sAccStatus: boolean = await getStatus(sName, sOrigin)
        const secondAccount: IUser = {
          name: sName,
          origin: sOrigin,
          img: makeBlockie(sName),
          userActive: false,
          accountActive: sAccStatus,
        }

        newPairs = newPairs.filter(
          (p) =>
            !(
              p.firstAccount.name === firstAccount.name &&
              p.firstAccount.origin === firstAccount.origin &&
              p.secondAccount.name === secondAccount.name &&
              p.secondAccount.origin === secondAccount.origin
            ) &&
            !(
              p.secondAccount.name === firstAccount.name &&
              p.secondAccount.origin === firstAccount.origin &&
              p.firstAccount.name === secondAccount.name &&
              p.firstAccount.origin === secondAccount.origin
            )
        )

        newPairs.unshift({
          firstAccount,
          secondAccount,
          statusName: Status.Error,
          statusLabel: Attention,
          statusMessage: verificationRequest.isUnlink
            ? 'Disconnection rejected'
            : 'Connection rejected',
          userActive: false,
          closeness: 1,
        })
        // console.log('newPairs', newPairs)
      }
    }

    // console.log("let's set!")
    setPairs(newPairs)

    // *** UPDATE ***
    if (processingAccountIdsPairs.length > 0) {
      await new Promise((res) => setTimeout(res, 5000))
      setAllPairs(newPendingIds)
    }
  }

  useEffect(() => {
    setAllPairs()
  }, [])

  // const temporaryOpenModalTransaction = () => {
  // setModalWaitTransaction(true)
  // setTimeout(() => {
  //   onCloseModalWaitTransaction()
  // }, 5000)
  // }

  const handleDisconnectAccounts = async (firstAccount: IUser, secondAccount: IUser) => {
    const { getMinStakeAmount, requestVerification } = await initBGFunctions(browser)
    const minStakeAmount: number = await getMinStakeAmount()
    const requestBody = {
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
    }
    await requestVerification(requestBody, minStakeAmount)
    setAllPairs()
  }

  const handleSetMainAccount = async (
    accountId: string,
    originId: string,
    isAlreadyMain: boolean
  ) => {
    const { changeStatus } = await initBGFunctions(browser)
    await changeStatus(accountId, originId, !isAlreadyMain)
    setAllPairs()
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
                    onClick={() =>
                      handleSetMainAccount(
                        x.firstAccount.name,
                        x.firstAccount.origin,
                        x.firstAccount.accountActive
                      )
                    }
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
                  <div
                    className={cn(styles.account, {
                      [styles.nameUserActive]: x.secondAccount.accountActive,
                    })}
                    onClick={() =>
                      handleSetMainAccount(
                        x.secondAccount.name,
                        x.secondAccount.origin,
                        x.secondAccount.accountActive
                      )
                    }
                  >
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
                    onClick={(e: any) => {
                      // if (x.firstAccount.accountActive === true) {
                      // setActiveId(i)
                      // setModalDeleteMainAccount(true)
                      // } else {
                      e.target.disabled = true
                      handleDisconnectAccounts(x.firstAccount, x.secondAccount)
                      // }
                    }}
                    className={styles.buttonDelete}
                    disabled={x.closeness > 1 || x.statusName !== Status.Connected}
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
      {/* <Modal
        visible={isModalWaitTransaction}
        classNameWrapper={styles.contentModal}
        title="Metamask message"
        content={'confirm the transaction to set your alias'}
        footer={''}
        onClose={() => onCloseModalWaitTransaction()}
      /> */}
    </div>
  )
}

const hasEqualPair = (pair: [string, string], list: [string, string][]): boolean => {
  for (const one of list) {
    if ((one[0] === pair[0] && one[1] === pair[1]) || (one[0] === pair[1] && one[1] === pair[0])) {
      return true
    }
  }
  return false
}
