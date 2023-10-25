import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { Bus } from '../../../../../../../common/bus'
import { resources } from '../../../../../../../common/resources'
import {
  EthSignature,
  IConnectedAccountUser,
  NearNetworks,
} from '../../../../../../../common/types'
import { CAUserButton } from '../../../CAUserButton'
import { DropdownCAModal } from '../../../DropdownCAModal'
import areConnectedAccountsUsersWallets from './helpers/areConnectedAccountsUsersWallets'
import checkIfTheAccountsHaveBeenAlreadyConnected from './helpers/checkIfTheAccountsHaveBeenAlreadyConnected'
import getSignature from './helpers/getSignature'
import getSocialOriginTitle from './helpers/getSocialOriginTitle'
import isThereAPendingRequestForThisCAUsers from './helpers/isThereAPendingRequestForThisCAUsers'
import { Modal } from './modal'

interface IConnectedAccountsModalProps {
  data: {
    accountsToConnect?: [IConnectedAccountUser, IConnectedAccountUser]
    bunchOfAccountsToConnect?: [IConnectedAccountUser, IConnectedAccountUser][]
    accountsToDisconnect?: [IConnectedAccountUser, IConnectedAccountUser]
    accountToChangeStatus?: IConnectedAccountUser
    condition?: {
      result: boolean
      original: {
        type: string
        [name: string]: string
      }
    }
    frameId: string
  }
  onCloseClick: () => void
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

const ModalCAUserButton = ({
  user,
  copyButton = false,
}: {
  user: IConnectedAccountUser
  copyButton?: boolean
}) => <CAUserButton user={user} maxLength={24} color="#eaf0f0" copyButton={copyButton} />

const ConnectedAccountsModal = (props: IConnectedAccountsModalProps) => {
  const { data, onCloseClick, bus } = props

  const {
    accountToChangeStatus,
    condition,
    accountsToConnect,
    bunchOfAccountsToConnect,
    accountsToDisconnect,
  } = data

  const [wait, setWait] = useState(true)
  const [isWaiting, setIsWaiting] = useState(false)
  const [requestBody, setRequestBody] = useState<TRequestBody>()
  const [contractNetwork, setContractNetwork] = useState<NearNetworks>()
  const [firstSelectorUsers, setFirstSelectorUsers] = useState<IConnectedAccountUser[]>()
  const [selectedFirstUser, setSelectedFirstUser] = useState<IConnectedAccountUser>()
  const [secondSelectorUsers, setSecondSelectorUsers] = useState<IConnectedAccountUser[]>()
  const [selectedSecondUser, setSelectedSecondUser] = useState<IConnectedAccountUser>()
  const [isUnlink, setIsUnlink] = useState<boolean>()
  const [alreadyConnected, setAlreadyConnected] = useState<boolean>()
  const [alreadyHasPendingRequest, setAlreadyHasPendingRequest] = useState<boolean>()
  const [areBothWallets, setAreBothWallets] = useState<boolean>()

  const init = async () => {
    const { getPreferredConnectedAccountsNetwork } = await initBGFunctions(browser)
    const preferredConnectedAccountsNetwork: NearNetworks =
      await getPreferredConnectedAccountsNetwork()
    setContractNetwork(preferredConnectedAccountsNetwork)

    if (accountsToConnect) {
      setIsUnlink(false)
      setFirstSelectorUsers([accountsToConnect[0]])
      setSelectedFirstUser(accountsToConnect[0])
      setSecondSelectorUsers([accountsToConnect[1]])
      setSelectedSecondUser(accountsToConnect[1])
    } else if (bunchOfAccountsToConnect) {
      setIsUnlink(false)
      const valuesForFirstSelector = bunchOfAccountsToConnect
        .map((p) => p[1])
        .reduce((res, account) => {
          if (!res.some((r) => r.name === account.name && r.origin === account.origin)) {
            res.push(account)
          }
          return res
        }, [])
      const valuesForSecondSelector = bunchOfAccountsToConnect
        .map((p) => p[0])
        .reduce((res, account) => {
          if (!res.some((r) => r.name === account.name && r.origin === account.origin)) {
            res.push(account)
          }
          return res
        }, [])
      setFirstSelectorUsers(valuesForFirstSelector)
      if (valuesForFirstSelector.length === 1) setSelectedFirstUser(valuesForFirstSelector[0])
      setSecondSelectorUsers(valuesForSecondSelector)
      if (valuesForSecondSelector.length === 1) setSelectedSecondUser(valuesForSecondSelector[0])
      setWait(false)
    } else if (accountsToDisconnect) {
      setIsUnlink(true)
      setFirstSelectorUsers([accountsToDisconnect[0]])
      setSelectedFirstUser(accountsToDisconnect[0])
      setSecondSelectorUsers([accountsToDisconnect[1]])
      setSelectedSecondUser(accountsToDisconnect[1])
    } else {
      setWait(false)
    }
  }

  useEffect(() => {
    init()
  }, [])

  const setSelectedPairParameters = async (): Promise<void> => {
    const areThereSamePendingRequests = await isThereAPendingRequestForThisCAUsers([
      selectedFirstUser,
      selectedSecondUser,
    ])
    const areAccountsAlreadyConnected = await checkIfTheAccountsHaveBeenAlreadyConnected([
      selectedFirstUser,
      selectedSecondUser,
    ])
    setAlreadyConnected(areAccountsAlreadyConnected)
    setAlreadyHasPendingRequest(areThereSamePendingRequests)
    setAreBothWallets(areConnectedAccountsUsersWallets(selectedFirstUser, selectedSecondUser))
    setWait(false)
  }

  useEffect(() => {
    selectedFirstUser && selectedSecondUser && setSelectedPairParameters()
  }, [selectedFirstUser, selectedSecondUser])

  const sendVerivicationRequest = async () => {
    const { requestConnectingAccountsVerification } = await initBGFunctions(browser)
    try {
      await requestConnectingAccountsVerification(requestBody, null)
    } catch (err) {
      if (err.message !== 'User rejected the transaction.')
        console.log('Error in requestConnectingAccountsVerification().', err)
    }

    setIsWaiting(false)
    bus.publish('ready')
    setRequestBody(null)
    onCloseClick()
  }

  useEffect(() => {
    if (requestBody) sendVerivicationRequest()
  }, [requestBody])

  const handleConnectOrDisconnect = async () => {
    setIsWaiting(true)
    const { getConnectedAccountsMinStakeAmount, requestConnectingAccountsVerification } =
      await initBGFunctions(browser)
    const minStakeAmount: number = await getConnectedAccountsMinStakeAmount()
    const firstProofUrl = resources[selectedFirstUser.origin].proofUrl(selectedFirstUser.name)
    const secondProofUrl = resources[selectedSecondUser.origin].proofUrl(selectedSecondUser.name)

    let body: TRequestBody

    if (areBothWallets) {
      try {
        const statement = `I confirm that I am the owner of Account A and Account B and I want to ${
          isUnlink ? 'unlink' : 'link'
        } them in the Connected Accounts service.`
        if (selectedFirstUser.origin.indexOf('ethereum') === 0) {
          const ethSignature = await getSignature(
            selectedSecondUser.name,
            selectedSecondUser.origin,
            selectedFirstUser.name,
            selectedFirstUser.origin,
            selectedFirstUser.walletType,
            statement
          )
          body = {
            firstAccountId: selectedFirstUser.name,
            firstOriginId: 'ethereum',
            secondAccountId: selectedSecondUser.name,
            secondOriginId: selectedSecondUser.origin,
            isUnlink,
            signature: ethSignature,
            statement,
          }
        } else if (selectedSecondUser.origin.indexOf('ethereum') === 0) {
          const ethSignature = await getSignature(
            selectedFirstUser.name,
            selectedFirstUser.origin,
            selectedSecondUser.name,
            selectedSecondUser.origin,
            selectedSecondUser.walletType,
            statement
          )
          body = {
            firstAccountId: selectedFirstUser.name,
            firstOriginId: selectedFirstUser.origin,
            secondAccountId: selectedSecondUser.name,
            secondOriginId: 'ethereum',
            isUnlink,
            signature: ethSignature,
            statement,
          }
        } else {
          throw new Error(
            'Wrong wallet types to connect: ' +
              selectedFirstUser.origin +
              ', ' +
              selectedSecondUser.origin
          )
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
        firstAccountId: selectedFirstUser.name,
        firstOriginId: selectedFirstUser.origin,
        secondAccountId: selectedSecondUser.name,
        secondOriginId: selectedSecondUser.origin,
        firstProofUrl,
        secondProofUrl,
        isUnlink,
      }
      try {
        await requestConnectingAccountsVerification(body, minStakeAmount)
      } catch (err) {
        if (err.message !== 'User rejected the transaction.')
          console.log('Error in requestConnectingAccountsVerification().', err)
      }
      setIsWaiting(false)
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
    bus.publish('ready')
    onCloseClick()
  }

  const socialNetworkToConnect =
    (accountsToConnect || accountsToDisconnect) &&
    getSocialOriginTitle(accountsToConnect || accountsToDisconnect)

  if (wait) {
    return <Modal isWaiting={true} onClose={onCloseClick} />
  }

  if (selectedFirstUser && selectedSecondUser && !areBothWallets && alreadyHasPendingRequest) {
    return (
      <Modal
        isWaiting={isWaiting}
        title={'You have already sent a request'}
        content={'Check the connected accounts list to see connection status'}
        onClose={onCloseClick}
      />
    )
  }

  if (
    selectedFirstUser &&
    selectedSecondUser &&
    !areBothWallets &&
    ((alreadyConnected && !isUnlink) || (!alreadyConnected && isUnlink))
  ) {
    return (
      <Modal
        isWaiting={isWaiting}
        title={`You have already ${isUnlink ? 'disconnected' : 'connected'} the accounts`}
        content={'Check the connected accounts list'}
        onClose={onCloseClick}
      />
    )
  }

  if (condition.result) {
    const walletAccount = selectedFirstUser.walletType ? selectedFirstUser : selectedSecondUser
    return (
      <Modal
        isWaiting={isWaiting}
        title={'Add your NEAR account ID'}
        accounts={<ModalCAUserButton user={walletAccount} copyButton={true} />}
        content={`to your ${socialNetworkToConnect} username <u>${
          condition.original['user']
        }</u>. For example:\n \n<info ${socialNetworkToConnect.toLowerCase()}>${
          condition.original['user']
        } (${
          walletAccount.name
        })</info>\n \nThis is done so the Oracle can confirm your ownership of the ${socialNetworkToConnect} account.`}
        onClose={onCloseClick}
        onConfirm={async () => {
          bus.publish('ready')
          onCloseClick()
        }}
        onConfirmLabel="Already done"
      />
    )
  }

  // ToDo: site-specific things must be removed or moved to another layer
  //       origin === 'github'
  if (firstSelectorUsers?.length && secondSelectorUsers?.length) {
    if (!isUnlink) {
      return (
        <Modal
          isWaiting={isWaiting}
          title={
            !selectedFirstUser || !selectedSecondUser
              ? 'Select accounts'
              : isWaiting
              ? 'Connecting'
              : 'Do you want to connect these accounts?'
          }
          content={
            !selectedFirstUser || !selectedSecondUser
              ? 'Select the two wallets you want to link in the Connected Accounts service.'
              : areConnectedAccountsUsersWallets(selectedFirstUser, selectedSecondUser)
              ? isWaiting
                ? requestBody
                  ? 'Please approve NEAR transaction'
                  : `Please sign the message in ${
                      EthWalletNames[selectedFirstUser.walletType] ||
                      EthWalletNames[selectedSecondUser.walletType] ||
                      ''
                    }`
                : `You need to sign a message in ${
                    EthWalletNames[selectedFirstUser.walletType] ||
                    EthWalletNames[selectedSecondUser.walletType] ||
                    ''
                  } and approve the transaction to the Connected Accounts NEAR contract in order to link your Ethereum and NEAR accounts.`
              : isWaiting
              ? 'Please approve NEAR transaction'
              : selectedFirstUser.origin === 'twitter' || selectedSecondUser.origin === 'twitter'
              ? `You need to have your NEAR account name listed in your Twitter profile name to link your accounts.\nExample: Sam Green (sam.${
                  contractNetwork === NearNetworks.Mainnet ? 'near' : 'testnet'
                })`
              : selectedFirstUser.origin === 'github' || selectedSecondUser.origin === 'github'
              ? `You need to have your NEAR account name listed in your GitHub profile name to link your accounts.\nExample: Sam Green (sam.${
                  contractNetwork === NearNetworks.Mainnet ? 'near' : 'testnet'
                })`
              : undefined
          }
          accounts={
            <>
              <DropdownCAModal
                values={firstSelectorUsers}
                setter={setSelectedFirstUser}
                selected={selectedFirstUser}
              />
              <DropdownCAModal
                values={secondSelectorUsers}
                setter={setSelectedSecondUser}
                selected={selectedSecondUser}
              />
            </>
          }
          onClose={onCloseClick}
          onConfirm={selectedFirstUser && selectedSecondUser && handleConnectOrDisconnect}
          onConfirmLabel="Connect"
        />
      )
    } else {
      return (
        <Modal
          isWaiting={isWaiting}
          title={
            !selectedFirstUser || !selectedSecondUser
              ? 'Select accounts'
              : isWaiting
              ? 'Disconnecting'
              : 'Do you want to disconnect these accounts?'
          }
          content={
            !selectedFirstUser || !selectedSecondUser
              ? 'Select the two wallets you want to unlink in the Connected Accounts service.'
              : areConnectedAccountsUsersWallets(selectedFirstUser, selectedSecondUser)
              ? isWaiting
                ? requestBody
                  ? 'Please approve NEAR transaction'
                  : `Please sign the message in ${
                      EthWalletNames[selectedFirstUser.walletType] ||
                      EthWalletNames[selectedSecondUser.walletType] ||
                      ''
                    }`
                : `You need to sign a message in ${
                    EthWalletNames[selectedFirstUser.walletType] ||
                    EthWalletNames[selectedSecondUser.walletType] ||
                    ''
                  } and approve the transaction to the Connected Accounts NEAR contract in order to unlink your Ethereum and NEAR accounts.`
              : isWaiting
              ? 'Please approve NEAR transaction'
              : selectedFirstUser.origin === 'twitter' || selectedSecondUser.origin === 'twitter'
              ? `You need to have your NEAR account name listed in your Twitter profile name to unlink your accounts.\nExample: Sam Green (sam.${
                  contractNetwork === NearNetworks.Mainnet ? 'near' : 'testnet'
                })`
              : selectedFirstUser.origin === 'github' || selectedSecondUser.origin === 'github'
              ? `You need to have your NEAR account name listed in your GitHub profile name to unlink your accounts.\nExample: Sam Green (sam.${
                  contractNetwork === NearNetworks.Mainnet ? 'near' : 'testnet'
                })`
              : undefined
          }
          accounts={
            <>
              <DropdownCAModal
                values={firstSelectorUsers}
                setter={setSelectedFirstUser}
                selected={selectedFirstUser}
              />
              <DropdownCAModal
                values={secondSelectorUsers}
                setter={setSelectedSecondUser}
                selected={selectedSecondUser}
              />
            </>
          }
          onClose={onCloseClick}
          onConfirm={selectedFirstUser && selectedSecondUser && handleConnectOrDisconnect}
          onConfirmLabel="Disconnect"
        />
      )
    }
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
        accounts={<ModalCAUserButton user={accountToChangeStatus} />}
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

const EthWalletNames = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
}

export default ConnectedAccountsModal
