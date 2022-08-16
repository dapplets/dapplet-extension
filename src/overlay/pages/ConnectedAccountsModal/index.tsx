import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { IConnectedAccountUser } from '../../../common/types'
import styles from './ConnectedAccountsModal.module.scss'
import { Modal } from './modal'

const UserButton = ({ user }: { user: IConnectedAccountUser }) => {
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
  const { data, onCloseClick, bus } = props
  const { accountsToConnect, accountsToDisconnect, accountToChangeStatus } = data

  const [isWaiting, setIsWaiting] = useState(false)

  const handleConnectOrDisconnect = async (
    firstAccount: IConnectedAccountUser,
    secondAccount: IConnectedAccountUser,
    isUnlink: boolean
  ) => {
    const { getConnectedAccountsMinStakeAmount, requestConnectingAccountsVerification } =
      await initBGFunctions(browser)
    const minStakeAmount: number = await getConnectedAccountsMinStakeAmount()
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
      requestId = await requestConnectingAccountsVerification(requestBody, minStakeAmount)
    } catch (err) {
      console.log('Error in requestConnectingAccountsVerification().', err)
    }

    setIsWaiting(false)
    const frameId = data.frameId
    bus.publish('ready', [frameId, { requestId }])
    onCloseClick()
  }

  const handleSetMainAccount = async (account: IConnectedAccountUser) => {
    const { changeConnectedAccountStatus } = await initBGFunctions(browser)

    try {
      setIsWaiting(true)
      const res = await changeConnectedAccountStatus(
        account.name,
        account.origin,
        !account.accountActive
      )
    } catch (err) {
      console.log('Error in changeConnectedAccountStatus().', err)
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
          isWaiting={isWaiting}
          title="Do you want to connect these accounts?"
          accounts={
            <>
              <UserButton user={accountsToConnect[0]} />
              <UserButton user={accountsToConnect[1]} />
            </>
          }
          onClose={onCloseClick}
          onConfirm={async () => {
            await handleConnectOrDisconnect(accountsToConnect[0], accountsToConnect[1], false)
          }}
          onConfirmLabel="Connect"
        />
      )}
      {!!accountsToDisconnect && (
        <Modal
          isWaiting={isWaiting}
          title="Do you want to disconnect these accounts?"
          accounts={
            <>
              <UserButton user={accountsToDisconnect[0]} />
              <UserButton user={accountsToDisconnect[1]} />
            </>
          }
          onClose={onCloseClick}
          onConfirm={async () => {
            await handleConnectOrDisconnect(accountsToDisconnect[0], accountsToDisconnect[1], true)
          }}
          onConfirmLabel="Disconnect"
        />
      )}
      {!!accountToChangeStatus && (
        <Modal
          isWaiting={isWaiting}
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
          onClose={onCloseClick}
          onConfirm={async () => {
            await handleSetMainAccount(accountToChangeStatus)
          }}
          onConfirmLabel="Confirm"
        />
      )}
    </>
  )
}

export default ConnectedAccountsModal
