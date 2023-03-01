import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../common/global-event-bus'
import { resources } from '../../../../../common/resources'
import {
  ChainTypes,
  ConnectedAccountsPairStatus,
  IConnectedAccountsPair,
  IConnectedAccountUser,
  NearNetworks,
  WalletDescriptor,
  WalletTypes,
} from '../../../../../common/types'
import { Message } from '../../components/Message'
import areWeLinkingWallets from '../../components/SystemPopup/pages/ConnectedAccountsModal/helpers/areWeLinkingWallets'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
import Attention from './assets/attention.svg'
import { ReactComponent as Info } from './assets/info.svg'
import HOME_ICON from './assets/newHome.svg'
import Ok from './assets/ok.svg'
import Time from './assets/time.svg'
import { ReactComponent as Trash } from './assets/trash.svg'
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
      <img src={resources[user.origin].icon} className={styles.imgUser} />
      <h4 className={styles.nameUser}>
        {user.name.length > 32 ? user.name.slice(0, 15) + '...' + user.name.slice(-14) : user.name}
      </h4>
    </div>
  )
}

export const ConnectedAccount = () => {
  const [contractNetwork, setContractNetwork] = useState<NearNetworks>()
  const [pairs, setPairs] = useState<IConnectedAccountsPair[]>([])
  const [walletsForConnectOrDisconnect, setWalletsForConnectOrDisconnect] = useState<
    [IConnectedAccountUser, IConnectedAccountUser] | []
  >([])
  const [areAuthorizedWalletsConnected, setAreAuthorizedWalletsConnected] = useState(false)
  const [isLoadingListDapplets, setLoadingListDapplets] = useState(true)
  const [showConnectWalletsInfo, setShowConnectWalletsInfo] = useState(false)
  const abortController = useAbortController()

  const updatePairs = async (prevPairs?: IConnectedAccountsPair[]) => {
    const { getConnectedAccountsPairs, execConnectedAccountsUpdateHandler } = await initBGFunctions(
      browser
    )
    const newPairs: IConnectedAccountsPair[] = await getConnectedAccountsPairs({ prevPairs })
    if (!abortController.signal.aborted) {
      setPairs(newPairs)
    }

    // *** UPDATE ***
    if (!newPairs || newPairs.length === 0) return
    const processingAccountIdsPairs = newPairs.filter(
      (p) => p.statusName === ConnectedAccountsPairStatus.Processing
    )
    if (processingAccountIdsPairs.length > 0) {
      await new Promise((res) => setTimeout(res, 5000))
      await execConnectedAccountsUpdateHandler()
      updatePairs(newPairs)
    }
  }

  useEffect(() => {
    initBGFunctions(browser).then(async ({ getPreferredConnectedAccountsNetwork }) => {
      const preferredConnectedAccountsNetwork: NearNetworks =
        await getPreferredConnectedAccountsNetwork()
      setContractNetwork(preferredConnectedAccountsNetwork)
    })
    return () => {}
  }, [abortController.signal.aborted])

  useEffect(() => {
    if (contractNetwork) {
      updatePairs().then(() => {
        if (!abortController.signal.aborted) {
          setLoadingListDapplets(false)
        }
      })
    }

    EventBus.on('wallet_changed', updatePairs)
    return () => {
      EventBus.off('wallet_changed', updatePairs)
    }
  }, [abortController.signal.aborted, contractNetwork])

  const findWalletsToConnect = async () => {
    const { getWalletDescriptors, getConnectedAccountStatus } = await initBGFunctions(browser)
    const descriptors: WalletDescriptor[] = await getWalletDescriptors()
    const connectedWalletsDescriptors = descriptors.filter((d) => d.connected === true)
    if (!connectedWalletsDescriptors.length) {
      setWalletsForConnectOrDisconnect([])
      setAreAuthorizedWalletsConnected(false)
      return
    }
    const connectedEthWallet = connectedWalletsDescriptors.filter(
      (d: WalletDescriptor) =>
        d.type === WalletTypes.METAMASK &&
        (d.chain === ChainTypes.ETHEREUM_GOERLI || d.chain === ChainTypes.ETHEREUM_XDAI)
    )[0]
    if (!connectedEthWallet) {
      setWalletsForConnectOrDisconnect([])
      setAreAuthorizedWalletsConnected(false)
      return
    }
    const connectedNearWallet = connectedWalletsDescriptors.filter((d: WalletDescriptor) =>
      contractNetwork === NearNetworks.Testnet
        ? d.chain === ChainTypes.NEAR_TESTNET
        : d.chain === ChainTypes.NEAR_MAINNET
    )[0]
    if (!connectedNearWallet) {
      setWalletsForConnectOrDisconnect([])
      setAreAuthorizedWalletsConnected(false)
      return
    }

    const setAccounts = async () => {
      const status1 = await getConnectedAccountStatus(connectedEthWallet.account, 'ethereum')
      const connectedAccountUser1: IConnectedAccountUser = {
        img: resources.ethereum.icon,
        name: connectedEthWallet.account,
        origin: connectedEthWallet.chain,
        accountActive: status1,
      }
      const status2 = await getConnectedAccountStatus(
        connectedNearWallet.account,
        contractNetwork === NearNetworks.Testnet ? ChainTypes.NEAR_TESTNET : ChainTypes.NEAR_MAINNET
      )
      const connectedAccountUser2: IConnectedAccountUser = {
        img: resources[contractNetwork === NearNetworks.Testnet ? 'near/testnet' : 'near/mainnet']
          .icon,
        name: connectedNearWallet.account,
        origin:
          contractNetwork === NearNetworks.Testnet
            ? ChainTypes.NEAR_TESTNET
            : ChainTypes.NEAR_MAINNET,
        accountActive: status2,
      }
      setWalletsForConnectOrDisconnect([connectedAccountUser1, connectedAccountUser2])
    }

    if (!pairs.length) {
      setAreAuthorizedWalletsConnected(false)
    } else {
      let areSameWallets = false
      for (const pair of pairs.filter((x) => x.closeness === 1)) {
        if (
          (pair.firstAccount.name === connectedEthWallet.account &&
          pair.firstAccount.origin === 'ethereum' &&
          pair.secondAccount.name === connectedNearWallet.account &&
          contractNetwork === NearNetworks.Testnet
            ? pair.secondAccount.origin === 'near/testnet'
            : pair.secondAccount.origin === 'near/mainnet') ||
          (pair.secondAccount.name === connectedEthWallet.account &&
          pair.secondAccount.origin === 'ethereum' &&
          pair.firstAccount.name === connectedNearWallet.account &&
          contractNetwork === NearNetworks.Testnet
            ? pair.firstAccount.origin === 'near/testnet'
            : pair.firstAccount.origin === 'near/mainnet')
        ) {
          areSameWallets = true
          break
        }
      }
      setAreAuthorizedWalletsConnected(areSameWallets)
    }
    setAccounts()
  }

  useEffect(() => {
    if (contractNetwork) findWalletsToConnect()
  }, [pairs, contractNetwork])

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

  const handleConnectAccounts = async () => {
    if (!walletsForConnectOrDisconnect.length || areAuthorizedWalletsConnected) return
    const {
      openConnectedAccountsPopup,
      getThisTab,
    }: {
      openConnectedAccountsPopup: (
        {
          accountsToConnect,
        }: { accountsToConnect: [IConnectedAccountUser, IConnectedAccountUser] },
        id: number
      ) => Promise<void>
      getThisTab: () => Promise<{ id: number }>
    } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    try {
      await openConnectedAccountsPopup(
        {
          accountsToConnect: walletsForConnectOrDisconnect,
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
        <div className={cn(styles.wrapper, styles.scrollContent)}>
          <div className={styles.connectWalletsBtnModule}>
            <button
              disabled={!walletsForConnectOrDisconnect.length || areAuthorizedWalletsConnected}
              className={styles.connectWalletsBtn}
              onClick={() => handleConnectAccounts()}
            >
              Connect wallets
            </button>
            <button
              className={cn(styles.connectWalletsBtnInfo, showConnectWalletsInfo && styles.active)}
              onClick={() => setShowConnectWalletsInfo(!showConnectWalletsInfo)}
            >
              <Info />
            </button>
          </div>
          <div className={styles.connectWalletsInfoWrapper}>
            <div
              className={cn(
                styles.connectWalletsInfo,
                showConnectWalletsInfo && styles.connectWalletsInfoVisible
              )}
            >
              <p>You can connect your Ethereum account to your NEAR account.</p>
              <p>
                Add the wallets you want to connect to the WALLETS list above and click the button.
              </p>
            </div>
          </div>
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
                <h3 style={{ paddingLeft: 20 }}>Accounts</h3>
                <h3 style={{ paddingLeft: 24 }}>Status</h3>
              </div>
              {pairs.map((x, i) => {
                const statusLabel =
                  x.statusName === ConnectedAccountsPairStatus.Connected
                    ? Ok
                    : x.statusName === ConnectedAccountsPairStatus.Processing
                    ? Time
                    : Attention
                const areWallets = areWeLinkingWallets(x.firstAccount, x.secondAccount)
                const canDisconnectWallets =
                  walletsForConnectOrDisconnect.length &&
                  compareAccounts(walletsForConnectOrDisconnect, [x.firstAccount, x.secondAccount])
                return (
                  <div key={i} className={styles.mainBlock}>
                    <div className={cn(styles.accountBlock, styles.accountBlockVertical)}>
                      <UserButton user={x.firstAccount} handleOpenPopup={handleOpenPopup} />
                      <UserButton user={x.secondAccount} handleOpenPopup={handleOpenPopup} />
                    </div>
                    <div className={cn(styles.accountStatus)}>
                      <div data-title={x.statusMessage}>
                        <img
                          src={statusLabel}
                          className={cn(styles.statusLabel, {
                            [styles.statusConnected]:
                              x.statusName === ConnectedAccountsPairStatus.Connected,
                            [styles.statusProcessing]:
                              x.statusName === ConnectedAccountsPairStatus.Processing,
                            [styles.statusError]:
                              x.statusName === ConnectedAccountsPairStatus.Error,
                          })}
                          alt={x.statusMessage}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDisconnectAccounts(x)}
                        className={styles.buttonDelete}
                        disabled={
                          x.closeness > 1 ||
                          (!areWallets && x.statusName !== ConnectedAccountsPairStatus.Connected) ||
                          (areWallets && !canDisconnectWallets)
                        }
                      >
                        <Trash />
                      </button>
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

const deleteNetworkOfEthereumOrigin = (origin: string): string =>
  origin.indexOf('ethereum') === -1 ? origin : 'ethereum'

const makeSimplePair = (
  pair: [IConnectedAccountUser, IConnectedAccountUser]
): { name: string; origin: string }[] =>
  pair.map((ac) => {
    const origin = deleteNetworkOfEthereumOrigin(ac.origin)
    return { name: ac.name, origin }
  })

const compareAccounts = (
  pair1: [IConnectedAccountUser, IConnectedAccountUser],
  pair2: [IConnectedAccountUser, IConnectedAccountUser]
) => {
  const simplePair1 = makeSimplePair(pair1)
  const simplePair2 = makeSimplePair(pair2)
  return (
    (simplePair1[0].name === simplePair2[0].name &&
      simplePair1[0].origin === simplePair2[0].origin &&
      simplePair1[1].name === simplePair2[1].name &&
      simplePair1[1].origin === simplePair2[1].origin) ||
    (simplePair1[0].name === simplePair2[1].name &&
      simplePair1[0].origin === simplePair2[1].origin &&
      simplePair1[1].name === simplePair2[0].name &&
      simplePair1[1].origin === simplePair2[0].origin)
  )
}
