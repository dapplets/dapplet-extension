import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Message } from '../../components/Message'
import Attention from './assets/attention.svg'
import Ok from './assets/ok.svg'
import Time from './assets/time.svg'
import styles from './ConnectedAccount.module.scss'
import { IPair, IUser, Status, TAccount, TVerificationRequest } from './types'

const UserButton = ({
  user,
  handleOpenPopup,
}: {
  user: IUser
  handleOpenPopup: (account: IUser) => Promise<void>
}) => {
  return (
    <div
      className={cn(styles.account, {
        [styles.nameUserActive]: user.accountActive,
      })}
      onClick={() => handleOpenPopup(user)}
    >
      <img src={user.img} className={styles.imgUser} />
      <h4 className={styles.nameUser}>{user.name}</h4>
    </div>
  )
}

export const ConnectedAccount = () => {
  const [pairs, setPairs] = useState<IPair[]>([])

  const updatePairs = async (prevPairs?: IPair[]) => {
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

    const connectedDescriptors = descriptors.filter((d) => d.connected === true)
    if (!connectedDescriptors || connectedDescriptors.length === 0) return

    let newPairs: IPair[] = []
    let processingAccountIdsPairs: [string, string][] = []
    let newPendingIds: number[] = []

    for (const d of connectedDescriptors) {
      const connectedAccStatus: boolean = await getStatus(d.account, d.chain)
      const connectedAccount: IUser = {
        name: d.account,
        origin: d.chain,
        img: makeBlockie(d.account),
        accountActive: connectedAccStatus,
      }
      const globalId = d.account + '/' + d.chain

      // *** PENDING ***
      const addPendingPair = async (accountGlobalId: string, pendingRequestId: number) => {
        const [name, origin1, origin2] = accountGlobalId.split('/')
        const origin = origin2 ? origin1 + '/' + origin2 : origin1
        const accStatus: boolean = await getStatus(name, origin)
        newPairs.push({
          firstAccount: connectedAccount,
          secondAccount: {
            name,
            origin,
            img: makeBlockie(name),
            accountActive: accStatus,
          },
          statusName: Status.Processing,
          statusLabel: Time,
          statusMessage: 'Processing',
          closeness: 1,
          pendingRequestId,
        })
        processingAccountIdsPairs.push([globalId, accountGlobalId])
        newPendingIds.push(pendingRequestId)
      }

      const pendingRequestsIds: number[] = await getPendingRequests()
      if (pendingRequestsIds && pendingRequestsIds.length > 0) {
        for (const pendingRequestId of pendingRequestsIds) {
          const verificationRequest: TVerificationRequest = await getVerificationRequest(
            pendingRequestId
          )
          const { firstAccount, secondAccount } = verificationRequest
          if (firstAccount === globalId) {
            await addPendingPair(secondAccount, pendingRequestId)
          } else if (secondAccount === globalId) {
            await addPendingPair(firstAccount, pendingRequestId)
          }
        }
      }

      // *** CONNECTED ***
      const connectedAccounts: TAccount[][] = await getConnectedAccounts(d.account, d.chain, null)
      connectedAccounts.forEach((level, i) =>
        level.forEach((ca) => {
          if (hasEqualIdsPair([globalId, ca.id], processingAccountIdsPairs)) return
          const [caName, caOrigin1, caOrigin2] = ca.id.split('/')
          newPairs.push({
            firstAccount: connectedAccount,
            secondAccount: {
              name: caName,
              origin: caOrigin2 ? caOrigin1 + '/' + caOrigin2 : caOrigin1,
              img: makeBlockie(caName),
              accountActive: ca.status.isMain,
            },
            statusName: Status.Connected,
            statusLabel: Ok,
            statusMessage: 'Connected',
            closeness: i + 1,
          })
        })
      )
    }

    // *** REJECTED ***
    if (prevPairs) {
      const prevPendingPairs = prevPairs.filter(
        (pair) => pair.statusName && pair.statusName === Status.Processing
      )
      const resolvedPairs = prevPendingPairs.filter(
        (prevPair) => !newPendingIds.includes(prevPair.pendingRequestId!)
      )
      if (resolvedPairs.length !== 0) {
        for (const resolvedPair of resolvedPairs) {
          const requestStatus: 'not found' | 'pending' | 'approved' | 'rejected' =
            await getRequestStatus(resolvedPair.pendingRequestId!)
          if (requestStatus !== 'rejected') continue

          const newPairsLengthBeforeFilter = newPairs.length
          newPairs = newPairs.filter(
            (p) =>
              !(
                p.firstAccount.name === resolvedPair.firstAccount.name &&
                p.firstAccount.origin === resolvedPair.firstAccount.origin &&
                p.secondAccount.name === resolvedPair.secondAccount.name &&
                p.secondAccount.origin === resolvedPair.secondAccount.origin
              ) &&
              !(
                p.secondAccount.name === resolvedPair.firstAccount.name &&
                p.secondAccount.origin === resolvedPair.firstAccount.origin &&
                p.firstAccount.name === resolvedPair.secondAccount.name &&
                p.firstAccount.origin === resolvedPair.secondAccount.origin
              )
          )
          newPairs.unshift({
            firstAccount: resolvedPair.firstAccount,
            secondAccount: resolvedPair.secondAccount,
            statusName: Status.Error,
            statusLabel: Attention,
            statusMessage:
              newPairsLengthBeforeFilter === newPairs.length
                ? 'Connection rejected'
                : 'Disconnection rejected',
            closeness: 1,
          })
        }
      }
    }

    setPairs(newPairs)

    // *** UPDATE ***
    if (processingAccountIdsPairs.length > 0) {
      await new Promise((res) => setTimeout(res, 5000))
      updatePairs(newPairs)
    }
  }

  useEffect(() => {
    updatePairs()
  }, [])

  const handleOpenPopup = async (account: IUser) => {
    const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    try {
      await openConnectedAccountsPopup({ accountToChangeStatus: account }, thisTab.id)
      updatePairs()
    } catch (err) {
      console.log('ERROR in openConnectedAccountsPopup():', err)
    }
  }

  const handleDisconnectAccounts = async (pair: IPair) => {
    const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    try {
      await openConnectedAccountsPopup(
        {
          accountsToDisconnect: [pair.firstAccount, pair.secondAccount],
        },
        thisTab.id
      )
      updatePairs()
    } catch (err) {
      console.log('ERROR in openConnectedAccountsPopup():', err)
    }
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
                <div
                  className={cn(
                    styles.accountBlock,
                    (x.firstAccount.name + x.secondAccount.name).length > 30
                      ? styles.accountBlockVertical
                      : styles.accountBlockHorizontal
                  )}
                >
                  <UserButton user={x.firstAccount} handleOpenPopup={handleOpenPopup} />
                  <span className={styles.arrowsAccount} />
                  <UserButton user={x.secondAccount} handleOpenPopup={handleOpenPopup} />
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
                </div>
                <div className={cn(styles.accountDelete)}>
                  <button
                    type="button"
                    onClick={() => handleDisconnectAccounts(x)}
                    className={styles.buttonDelete}
                    disabled={x.closeness > 1 || x.statusName !== Status.Connected}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const hasEqualIdsPair = (pair: [string, string], list: [string, string][]): boolean => {
  for (const one of list) {
    if ((one[0] === pair[0] && one[1] === pair[1]) || (one[0] === pair[1] && one[1] === pair[0])) {
      return true
    }
  }
  return false
}
