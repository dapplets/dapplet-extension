import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { resources } from '../../../../../../../common/resources'
import {
  IConnectedAccountUser,
  TConnectedAccount,
  EthSignature,
} from '../../../../../../../common/types'
import { Modal } from './modal'
import { getSignature, areWeLinkingWallets } from './helpers'
import UserButton from './UserButton'
import { Bus } from '../../../../../../../common/bus'

interface IConnectedAccountsModalProps {
  data: {
    accountsToConnect?: [IConnectedAccountUser, IConnectedAccountUser]
    accountsToDisconnect?: [IConnectedAccountUser, IConnectedAccountUser]
    accountToChangeStatus?: IConnectedAccountUser
    condition?: boolean
    frameId: string
  }
  onCloseClick: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bus: Bus
}

type TRequestBody = {
  firstAccountId: string
  firstOriginId: string
  secondAccountId: string
  secondOriginId: string
  isUnlink: boolean
  signature?: EthSignature
  firstProofUrl?: string
  secondProofUrl?: string
  statement?: string
}

const ConnectedAccountsModal = (props: IConnectedAccountsModalProps) => {
  const { data, onCloseClick, bus } = props
  const { accountToChangeStatus, condition } = data

  const [accountsToConnect] = useState(data.accountsToConnect)
  const [accountsToDisconnect] = useState(data.accountsToDisconnect)
  const [areThereSameRequests, setAreThereSameRequests] = useState(false)
  const [wait, setWait] = useState(true)
  const [isWaiting, setIsWaiting] = useState(false)
  const [requestWasDoneBefore, setRequestWasDoneBefore] = useState(false)
  const [areAccountsWallets, setAreAccountsWallets] = useState(false)
  const [requestBody, setRequestBody] = useState<TRequestBody>()

  const askIfSameRequestsExist = async (
    accounts: [IConnectedAccountUser, IConnectedAccountUser]
  ) => {
    const [firstAccount, secondAccount] = accounts
    const firstAccountGlobalId = firstAccount.name + '/' + firstAccount.origin
    const secondAccountGlobalId = secondAccount.name + '/' + secondAccount.origin
    const { getConnectedAccountsPendingRequests, getConnectedAccountsVerificationRequest } =
      await initBGFunctions(browser)
    const a = await getConnectedAccountsPendingRequests()
    for (let i = 0; i < a.length; i++) {
      const b: { firstAccount: string; secondAccount: string } =
        await getConnectedAccountsVerificationRequest(a[i])
      const first = b.firstAccount
      const second = b.secondAccount
      const res =
        (first === firstAccountGlobalId && second === secondAccountGlobalId) ||
        (first === secondAccountGlobalId && second === firstAccountGlobalId)
      return res
    }
    return false
  }

  const checkIfTheAccountsHaveBeenAlreadyConnected = async (
    accounts: [IConnectedAccountUser, IConnectedAccountUser]
  ) => {
    const { getConnectedAccounts } = await initBGFunctions(browser)
    const accountFirstCA: TConnectedAccount[][] = await getConnectedAccounts(
      accounts[0].name,
      accounts[0].origin,
      1
    )
    const caGlobalNames = accountFirstCA[0].map((acc) => acc.id)
    const secondAccountGlobalId = accounts[1].name + '/' + accounts[1].origin
    return caGlobalNames.includes(secondAccountGlobalId)
  }

  useEffect(() => {
    const makeCheckup = async () => {
      if (accountsToConnect) {
        const answerAboutTheSameRequests = await askIfSameRequestsExist(accountsToConnect)
        const areAccountsAlreadyConnected = await checkIfTheAccountsHaveBeenAlreadyConnected(
          accountsToConnect
        )
        setAreAccountsWallets(areWeLinkingWallets(...accountsToConnect))
        setAreThereSameRequests(answerAboutTheSameRequests)
        setRequestWasDoneBefore(areAccountsAlreadyConnected)
        setWait(false)
      } else if (accountsToDisconnect) {
        const answerAboutTheSameRequests = await askIfSameRequestsExist(accountsToDisconnect)
        const areAccountsAlreadyConnected = await checkIfTheAccountsHaveBeenAlreadyConnected(
          accountsToDisconnect
        )
        setAreAccountsWallets(areWeLinkingWallets(...accountsToDisconnect))
        setAreThereSameRequests(answerAboutTheSameRequests)
        setRequestWasDoneBefore(!areAccountsAlreadyConnected)
        setWait(false)
      } else {
        setWait(false)
      }
    }

    makeCheckup()
  }, [accountsToConnect, accountsToDisconnect])

  useEffect(() => {
    const fn = async () => {
      // let requestId: number
      const { requestConnectingAccountsVerification } = await initBGFunctions(browser)
      try {
        /*requestId = */ await requestConnectingAccountsVerification(requestBody, null)
      } catch (err) {
        if (err.message !== 'User rejected the transaction.')
          console.log('Error in requestConnectingAccountsVerification().', err)
      }

      setIsWaiting(false)
      // const frameId = data.frameId
      // bus.publish('ready', [frameId, { requestId }])
      bus.publish('ready')
      setRequestBody(null)
      onCloseClick()
    }
    if (requestBody) fn()
  }, [requestBody])

  const handleConnectOrDisconnect = async (
    firstAccount: IConnectedAccountUser,
    secondAccount: IConnectedAccountUser,
    isUnlink: boolean
  ) => {
    setIsWaiting(true)
    const { getConnectedAccountsMinStakeAmount, requestConnectingAccountsVerification } =
      await initBGFunctions(browser)
    const minStakeAmount: number = await getConnectedAccountsMinStakeAmount()
    const firstProofUrl = resources[firstAccount.origin].proofUrl(firstAccount.name)
    const secondProofUrl = resources[secondAccount.origin].proofUrl(secondAccount.name)

    let body: TRequestBody

    if (areAccountsWallets) {
      try {
        const statement = `I confirm that I am the owner of Account A and Account B and I want to ${
          isUnlink ? 'unlink' : 'link'
        } them in the Connected Accounts service.`
        if (firstAccount.origin.indexOf('ethereum') === 0) {
          const ethSignature = await getSignature(
            secondAccount.name,
            firstAccount.name,
            firstAccount.origin,
            statement
          )
          body = {
            firstAccountId: firstAccount.name,
            firstOriginId: 'ethereum',
            secondAccountId: secondAccount.name,
            secondOriginId: secondAccount.origin,
            isUnlink,
            signature: ethSignature,
            statement,
          }
        } else if (secondAccount.origin.indexOf('ethereum') === 0) {
          const ethSignature = await getSignature(
            firstAccount.name,
            secondAccount.name,
            secondAccount.origin,
            statement
          )
          body = {
            firstAccountId: firstAccount.name,
            firstOriginId: firstAccount.origin,
            secondAccountId: secondAccount.name,
            secondOriginId: 'ethereum',
            isUnlink,
            signature: ethSignature,
            statement,
          }
        } else {
          throw new Error(
            'Wrong wallet types to connect: ' + firstAccount.origin + ', ' + secondAccount.origin
          ) // ERROR!!!!
        }
      } catch (err) {
        console.log(err)
        onCloseClick()
        return
      }
      setRequestBody(body)
      return
    } else {
      const body = {
        firstAccountId: firstAccount.name,
        firstOriginId: firstAccount.origin,
        secondAccountId: secondAccount.name,
        secondOriginId: secondAccount.origin,
        firstProofUrl,
        secondProofUrl,
        isUnlink,
      }
      // let requestId: number
      try {
        /*requestId =*/ await requestConnectingAccountsVerification(body, minStakeAmount)
      } catch (err) {
        if (err.message !== 'User rejected the transaction.')
          console.log('Error in requestConnectingAccountsVerification().', err)
      }
      setIsWaiting(false)
      // const frameId = data.frameId
      // bus.publish('ready', [frameId, { requestId }])
      bus.publish('ready')
      onCloseClick()
    }
  }

  const handleSetMainAccount = async (account: IConnectedAccountUser) => {
    const { changeConnectedAccountStatus } = await initBGFunctions(browser)

    try {
      setIsWaiting(true)
      await changeConnectedAccountStatus(account.name, account.origin, !account.accountActive)
    } catch (err) {
      if (err.message !== 'User rejected the transaction.')
        console.log('Error in changeConnectedAccountStatus().', err)
    }

    setIsWaiting(false)
    // const frameId = data.frameId
    // bus.publish('ready', [frameId, 'ok'])
    bus.publish('ready')
    onCloseClick()
  }

  const getTitle = ([firstAccount, secondAccount]: IConnectedAccountUser[]) =>
    resources[firstAccount.origin].type === 'social'
      ? resources[firstAccount.origin].title
      : resources[secondAccount.origin].title

  const socialNetworkToConnect =
    (accountsToConnect || accountsToDisconnect) &&
    getTitle(accountsToConnect || accountsToDisconnect)

  if (wait) {
    return <Modal isWaiting={true} onClose={onCloseClick} />
  }

  if (!areAccountsWallets && areThereSameRequests) {
    return (
      <Modal
        isWaiting={isWaiting}
        title={'You have already sent a request'}
        content={'Check the connected accounts list to see connection status'}
        onClose={onCloseClick}
      />
    )
  }

  if (!areAccountsWallets && requestWasDoneBefore) {
    return (
      <Modal
        isWaiting={isWaiting}
        title={`You have already ${accountsToConnect ? 'connected' : 'disconnected'} the accounts`}
        content={'Check the connected accounts list'}
        onClose={onCloseClick}
      />
    )
  }

  if (condition) {
    return (
      <Modal
        isWaiting={isWaiting}
        title={'Add your NEAR account ID'}
        content={`Add your NEAR account ID to your ${socialNetworkToConnect} username. This is done so the Oracle can confirm your ownership of the ${socialNetworkToConnect} account`}
        onClose={onCloseClick}
        onConfirm={async () => {
          // const frameId = data.frameId
          // bus.publish('ready', [frameId, 'ok'])
          bus.publish('ready')
          onCloseClick()
        }}
        onConfirmLabel="Already done"
      />
    )
  }

  if (accountsToConnect) {
    return (
      <Modal
        isWaiting={isWaiting}
        title={isWaiting ? 'Connecting' : 'Do you want to connect these accounts?'}
        content={
          areAccountsWallets
            ? isWaiting
              ? requestBody
                ? 'Please approve NEAR transaction'
                : 'Please sign the message in MetaMask'
              : 'You need to sign a message in MetaMask and approve the transaction to the Connected Accounts NEAR contract in order to link your Ethereum and NEAR accounts.'
            : isWaiting
            ? 'Please approve NEAR transaction'
            : accountsToConnect[0].origin === 'twitter' || accountsToConnect[1].origin === 'twitter'
            ? 'You need to have your NEAR account name listed in your Twitter profile name to link your accounts.\nExample: Sam Green (sam.testnet)'
            : accountsToConnect[0].origin === 'github' || accountsToConnect[1].origin === 'github'
            ? 'You need to have your NEAR account name listed in your GitHub profile name to link your accounts.\nExample: Sam Green (sam.testnet)'
            : undefined
        }
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
    )
  }

  if (accountsToDisconnect) {
    return (
      <Modal
        isWaiting={isWaiting}
        title={isWaiting ? 'Disconnecting' : 'Do you want to disconnect these accounts?'}
        content={
          areAccountsWallets
            ? isWaiting
              ? requestBody
                ? 'Please approve NEAR transaction'
                : 'Please sign the message in MetaMask'
              : 'You need to sign a message in MetaMask and approve the transaction to the Connected Accounts NEAR contract in order to unlink your Ethereum and NEAR accounts.'
            : isWaiting
            ? 'Please approve NEAR transaction'
            : accountsToDisconnect[0].origin === 'twitter' ||
              accountsToDisconnect[1].origin === 'twitter'
            ? 'You need to have your NEAR account name listed in your Twitter profile name to unlink your accounts.\nExample: Sam Green (sam.testnet)'
            : accountsToDisconnect[0].origin === 'github' ||
              accountsToDisconnect[1].origin === 'github'
            ? 'You need to have your NEAR account name listed in your GitHub profile name to unlink your accounts.\nExample: Sam Green (sam.testnet)'
            : undefined
        }
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
    )
  }

  if (accountToChangeStatus) {
    return (
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
    )
  }

  return (
    <Modal
      isWaiting={false}
      title={'Something went wrong'}
      content={'Close the tab'}
      onClose={onCloseClick}
    />
  )
}

export default ConnectedAccountsModal
