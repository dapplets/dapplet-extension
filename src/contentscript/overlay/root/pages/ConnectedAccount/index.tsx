import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../common/global-event-bus'
import {
  ConnectedAccountsPairStatus,
  IConnectedAccountsPair,
  IConnectedAccountUser,
} from '../../../../../common/types'
import { Message } from '../../components/Message'
import { TabLoader } from '../../components/TabLoader'
import Attention from './assets/attention.svg'
import HOME_ICON from './assets/newHome.svg'
import Ok from './assets/ok.svg'
import Time from './assets/time.svg'
import styles from './ConnectedAccount.module.scss'

const UserButton = ({
  user,
  handleOpenPopup,
}: {
  user: IConnectedAccountUser
  handleOpenPopup: (account: IConnectedAccountUser) => Promise<void>
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
  const [pairs, setPairs] = useState<IConnectedAccountsPair[]>([])

  const [isLoadingListDapplets, setLoadingListDapplets] = useState(true)

  const updatePairs = async (prevPairs?: IConnectedAccountsPair[]) => {
    const { getConnectedAccountsPairs } = await initBGFunctions(browser)
    const newPairs: IConnectedAccountsPair[] = await getConnectedAccountsPairs({ prevPairs })
    setPairs(newPairs)

    // *** UPDATE ***
    if (!newPairs || newPairs.length === 0) return
    const processingAccountIdsPairs = newPairs.filter(
      (p) => p.statusName === ConnectedAccountsPairStatus.Processing
    )
    if (processingAccountIdsPairs.length > 0) {
      await new Promise((res) => setTimeout(res, 5000))
      updatePairs(newPairs)
    }
  }

  useEffect(() => {
    updatePairs().then(() => setLoadingListDapplets(false))

    EventBus.on('wallet_changed', updatePairs)
    return () => {
      EventBus.off('wallet_changed', updatePairs)
    }
  }, [])

  const handleOpenPopup = async (account: IConnectedAccountUser) => {
    const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    try {
      await openConnectedAccountsPopup({ accountToChangeStatus: account }, thisTab.id)
      updatePairs()
    } catch (err) {}
  }

  const handleDisconnectAccounts = async (pair: IConnectedAccountsPair) => {
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
    } catch (err) {}
  }

  return (
    <>
      {isLoadingListDapplets ? (
        <TabLoader />
      ) : (
        <div className={cn(styles.wrapper)}>
          {!pairs || pairs.length === 0 ? (
            <Message
              className={styles.messageDelete}
              title={'There are no connected accounts'}
              subtitle={
                <p>
                  Check connected wallets or run Connecting Accounts dapplet and click{' '}
                  <span>
                    <img src={HOME_ICON} alt="home" style={{ width: 12 }} />
                  </span>{' '}
                  button to connect your accounts
                </p>
              }
            />
          ) : (
            <div className={styles.accountsWrapper}>
              <div className={styles.title}>
                <h3>Accounts</h3>
                <h3>Status</h3>
              </div>
              {pairs.map((x, i) => {
                const statusLabel =
                  x.statusName === ConnectedAccountsPairStatus.Connected
                    ? Ok
                    : x.statusName === ConnectedAccountsPairStatus.Processing
                    ? Time
                    : Attention
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
                        src={statusLabel}
                        className={cn(styles.statusLabel, {
                          [styles.statusConnected]:
                            x.statusName === ConnectedAccountsPairStatus.Connected,
                          [styles.statusProcessing]:
                            x.statusName === ConnectedAccountsPairStatus.Processing,
                          [styles.statusError]: x.statusName === ConnectedAccountsPairStatus.Error,
                        })}
                        alt={x.statusMessage}
                      />
                    </div>
                    <div className={cn(styles.accountDelete)}>
                      <button
                        type="button"
                        onClick={() => handleDisconnectAccounts(x)}
                        className={styles.buttonDelete}
                        disabled={
                          x.closeness > 1 || x.statusName !== ConnectedAccountsPairStatus.Connected
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
