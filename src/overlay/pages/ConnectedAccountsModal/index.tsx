import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { IUser } from '../../../contentscript/overlay/root/pages/ConnectedAccount/types'
import styles from './ConnectedAccountsModal.module.scss'
import { Modal } from './modal'

const UserButton = ({ user }: { user: IUser }) => {
  return (
    <div
      className={cn(styles.account, {
        [styles.nameUserActive]: user.accountActive,
      })}
    >
      <img src={user.img} className={styles.imgUser} />
      <h4 className={styles.nameUser}>{user.name}</h4>
    </div>
  )
}

const ConnectedAccountsModal = (props: any) => {
  console.log('props', props)
  const { data, onCloseClick, bus } = props
  const { accountsToConnect, accountsToDisconnect, accountToChangeStatus } = data
  console.log('accountsToConnect', accountsToConnect)

  const [isWaiting, setIsWaiting] = useState(false)

  const handleConnectOrDisconnect = async (
    firstAccount: IUser,
    secondAccount: IUser,
    isUnlink: boolean
  ) => {
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
      isUnlink,
    }

    let requestId: number
    try {
      setIsWaiting(true)
      requestId = await requestVerification(requestBody, minStakeAmount)
    } catch (err) {
      console.log('Error in requestVerification().', err)
    }

    setIsWaiting(false)
    const frameId = data.frameId
    bus.publish('ready', [frameId, { requestId }])
    onCloseClick()
  }

  const handleSetMainAccount = async (account: IUser) => {
    const { changeStatus } = await initBGFunctions(browser)

    try {
      setIsWaiting(true)
      const res = await changeStatus(account.name, account.origin, !account.accountActive)
    } catch (err) {
      console.log('Error in changeStatus().', err)
    }

    setIsWaiting(false)
    const frameId = data.frameId
    bus.publish('ready', [frameId, 'ok'])
    onCloseClick()
  }

  return (
    <>
      {!!accountsToConnect && (
        <Modal
          visible={true}
          isWaiting={isWaiting}
          classNameWrapper={styles.contentModal}
          title="Do you want to connect these accounts?"
          accounts={
            <>
              <UserButton user={accountsToConnect[0]} />
              <UserButton user={accountsToConnect[1]} />
            </>
          }
          footer={
            <div className={styles.wrapperModalWantLink}>
              <button
                onClick={async () => {
                  await handleConnectOrDisconnect(accountsToConnect[0], accountsToConnect[1], false)
                }}
                className={cn(styles.button, styles.primary)}
                disabled={isWaiting}
              >
                Connect
              </button>
              <button
                onClick={onCloseClick}
                className={cn(styles.button, styles.secondary)}
                disabled={isWaiting}
              >
                Cancel
              </button>
            </div>
          }
          onClose={onCloseClick}
        />
      )}
      {!!accountsToDisconnect && (
        <Modal
          visible={true}
          isWaiting={isWaiting}
          classNameWrapper={styles.contentModal}
          title="Do you want to disconnect these accounts?"
          accounts={
            <>
              <UserButton user={accountsToDisconnect[0]} />
              <UserButton user={accountsToDisconnect[1]} />
            </>
          }
          footer={
            <div className={styles.wrapperModalWantLink}>
              <button
                onClick={async () => {
                  await handleConnectOrDisconnect(
                    accountsToDisconnect[0],
                    accountsToDisconnect[1],
                    true
                  )
                }}
                className={cn(styles.button, styles.primary)}
                disabled={isWaiting}
              >
                Disconnect
              </button>
              <button
                onClick={onCloseClick}
                className={cn(styles.button, styles.secondary)}
                disabled={isWaiting}
              >
                Cancel
              </button>
            </div>
          }
          onClose={onCloseClick}
        />
      )}
      {!!accountToChangeStatus && (
        <Modal
          visible={true}
          isWaiting={isWaiting}
          classNameWrapper={styles.contentModal}
          title={
            accountToChangeStatus.accountActive
              ? 'Set this account to non-main?"'
              : 'Select this account as main?'
          }
          accounts={<UserButton user={accountToChangeStatus} />}
          content={
            accountToChangeStatus.accountActive
              ? ''
              : 'This will allow you to display your username instead of a standard ID in our ecosystem.'
          }
          footer={
            <div className={styles.wrapperModalWantLink}>
              <button
                onClick={async () => {
                  await handleSetMainAccount(accountToChangeStatus)
                }}
                className={cn(styles.button, styles.primary)}
                disabled={isWaiting}
              >
                Confirm
              </button>
              <button
                onClick={onCloseClick}
                className={cn(styles.button, styles.secondary)}
                disabled={isWaiting}
              >
                Cancel
              </button>
            </div>
          }
          onClose={onCloseClick}
        />
      )}
    </>
  )
}

export default ConnectedAccountsModal
