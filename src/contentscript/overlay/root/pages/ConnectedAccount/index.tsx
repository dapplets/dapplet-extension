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
  TConnectedAccount,
  WalletDescriptor,
  WalletDescriptorWithCAMainStatus,
  WalletTypes,
} from '../../../../../common/types'
import { CAUserButton } from '../../components/CAUserButton'
import { Message } from '../../components/Message'
import areConnectedAccountsUsersWallets from '../../components/SystemPopup/pages/ConnectedAccountsModal/helpers/areConnectedAccountsUsersWallets'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
import { DropdownCAListReceiver } from './../../../root/components/DropdownCAListReceiver'
import Attention from './assets/attention.svg'
import { ReactComponent as Info } from './assets/info.svg'
import HOME_ICON from './assets/newHome.svg'
import Ok from './assets/ok.svg'
import Time from './assets/time.svg'
import { ReactComponent as Trash } from './assets/trash.svg'
import styles from './ConnectedAccount.module.scss'

export const ConnectedAccount = () => {
  const [contractNetwork, setContractNetwork] = useState<NearNetworks>()
  const [pairsToDisplay, setPairs] = useState<IConnectedAccountsPair[]>([])
  const [walletsForConnect, setWalletsForConnect] = useState<
    [IConnectedAccountUser, IConnectedAccountUser][]
  >([])
  const [walletsForDisconnect, setWalletsForDisconnect] = useState<
    [IConnectedAccountUser, IConnectedAccountUser][]
  >([])
  const [isLoadingListDapplets, setLoadingListDapplets] = useState(true)
  const [showConnectWalletsInfo, setShowConnectWalletsInfo] = useState(false)
  const [walletsReceivers, setWalletsReceivers] = useState<
    WalletDescriptorWithCAMainStatus[] | undefined
  >()
  const [connectedAccountsListReceiver, setConnectedAccountsListReceiver] = useState<
    WalletDescriptorWithCAMainStatus | undefined
  >()
  const abortController = useAbortController()

  const updatePairs = async (prevPairs?: IConnectedAccountsPair[]) => {
    const { getConnectedAccountsPairs, execConnectedAccountsUpdateHandler } = await initBGFunctions(
      browser
    )
    const newPairs: IConnectedAccountsPair[] = connectedAccountsListReceiver
      ? await getConnectedAccountsPairs({
          receiver: connectedAccountsListReceiver,
          prevPairs,
        })
      : []
    if (!abortController.signal.aborted) {
      setPairs(newPairs)
    }

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

  const updateContractNetworkAndWallets = async () => {
    const {
      getPreferredConnectedAccountsNetwork,
      getWalletDescriptors,
      getConnectedAccountStatus,
    } = await initBGFunctions(browser)
    const preferredConnectedAccountsNetwork: NearNetworks =
      await getPreferredConnectedAccountsNetwork()
    setContractNetwork(preferredConnectedAccountsNetwork)
    const descriptors: WalletDescriptor[] = await getWalletDescriptors()
    const connectedWalletsDescriptors = descriptors
      .filter((d) => d.connected === true)
      .filter(
        (d: WalletDescriptor) =>
          d.type !== WalletTypes.DAPPLETS &&
          (d.chain === ChainTypes.ETHEREUM_GOERLI ||
            d.chain === ChainTypes.ETHEREUM_XDAI ||
            (preferredConnectedAccountsNetwork === NearNetworks.Testnet
              ? d.chain === ChainTypes.NEAR_TESTNET
              : d.chain === ChainTypes.NEAR_MAINNET))
      )
    const walletsForGettingCALists: WalletDescriptorWithCAMainStatus[] = await Promise.all(
      connectedWalletsDescriptors.map(async (wallet) => {
        const receiverOrigin =
          wallet.chain === ChainTypes.ETHEREUM_GOERLI || wallet.chain === ChainTypes.ETHEREUM_XDAI
            ? 'ethereum'
            : wallet.chain
        const receiverStatus: boolean = await getConnectedAccountStatus(
          wallet.account,
          receiverOrigin
        )
        return { ...wallet, accountActive: receiverStatus }
      })
    )
    setWalletsReceivers(walletsForGettingCALists)
    setConnectedAccountsListReceiver(walletsForGettingCALists[0])
  }

  useEffect(() => {
    updateContractNetworkAndWallets()
    EventBus.on('connected_accounts_changed', () => updateContractNetworkAndWallets())
    return () => {}
  }, [abortController.signal.aborted])

  useEffect(() => {
    if (contractNetwork) {
      setLoadingListDapplets(true)
      updatePairs().then(() => {
        if (!abortController.signal.aborted) {
          setLoadingListDapplets(false)
        }
      })
    }

    EventBus.on('wallet_changed', updateContractNetworkAndWallets)
    return () => {
      EventBus.off('wallet_changed', updateContractNetworkAndWallets)
    }
  }, [abortController.signal.aborted, contractNetwork, connectedAccountsListReceiver])

  const findWalletsToConnect = async () => {
    const { getWalletDescriptors, getConnectedAccountStatus, getConnectedAccounts } =
      await initBGFunctions(browser)
    const descriptors: WalletDescriptor[] = await getWalletDescriptors()
    const connectedWalletsDescriptors = descriptors.filter((d) => d.connected === true)
    if (connectedWalletsDescriptors.length < 2) {
      setWalletsForConnect([])
      setWalletsForDisconnect([])
      return
    }

    const connectedEthWallets = connectedWalletsDescriptors.filter(
      (d: WalletDescriptor) =>
        d.type !== WalletTypes.DAPPLETS &&
        (d.chain === ChainTypes.ETHEREUM_GOERLI || d.chain === ChainTypes.ETHEREUM_XDAI)
    )
    const connectedNearWallet = connectedWalletsDescriptors.find((d: WalletDescriptor) =>
      contractNetwork === NearNetworks.Testnet
        ? d.chain === ChainTypes.NEAR_TESTNET
        : d.chain === ChainTypes.NEAR_MAINNET
    )
    if (!connectedNearWallet) {
      // ToDo: we can't connect Eth wallets directly to each other. ONE Near wallet
      setWalletsForConnect([])
      setWalletsForDisconnect([])
      return
    }

    const connectedAccountsUserEth: IConnectedAccountUser[] = []

    for (const connectedEthWallet of connectedEthWallets) {
      const ethereumAccountStatus = await getConnectedAccountStatus(
        connectedEthWallet.account,
        'ethereum'
      )
      const connectedAccountUserEth: IConnectedAccountUser = {
        img: resources.ethereum.icon,
        name: connectedEthWallet.account,
        origin: connectedEthWallet.chain,
        accountActive: ethereumAccountStatus,
        walletType: connectedEthWallet.type,
      }
      connectedAccountsUserEth.push(connectedAccountUserEth)
    }

    const nearAccountStatus = await getConnectedAccountStatus(
      connectedNearWallet.account,
      contractNetwork === NearNetworks.Testnet ? ChainTypes.NEAR_TESTNET : ChainTypes.NEAR_MAINNET
    )
    const connectedAccountUserNear: IConnectedAccountUser = {
      img: resources[contractNetwork === NearNetworks.Testnet ? 'near/testnet' : 'near/mainnet']
        .icon,
      name: connectedNearWallet.account,
      origin:
        contractNetwork === NearNetworks.Testnet
          ? ChainTypes.NEAR_TESTNET
          : ChainTypes.NEAR_MAINNET,
      accountActive: nearAccountStatus,
    }

    const pairsToConnect: [IConnectedAccountUser, IConnectedAccountUser][] = []
    const pairsToDisconnect: [IConnectedAccountUser, IConnectedAccountUser][] = []
    const nearAccountGlobalId =
      connectedAccountUserNear.name + '/' + connectedAccountUserNear.origin
    loop1: for (const connectedAccountUserEth of connectedAccountsUserEth) {
      const directlyConnectedAccountsToEth: TConnectedAccount[][] = await getConnectedAccounts(
        connectedAccountUserEth.name,
        'ethereum',
        1
      )
      for (const ca of directlyConnectedAccountsToEth[0]) {
        if (ca.id === nearAccountGlobalId) {
          pairsToDisconnect.push([connectedAccountUserEth, connectedAccountUserNear])
          continue loop1
        }
      }
      pairsToConnect.push([connectedAccountUserEth, connectedAccountUserNear])
    }
    setWalletsForConnect(pairsToConnect)
    setWalletsForDisconnect(pairsToDisconnect)
  }

  useEffect(() => {
    if (contractNetwork) findWalletsToConnect()
  }, [pairsToDisplay, contractNetwork])

  const handleOpenPopup = async (account: IConnectedAccountUser) => {
    const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    try {
      await openConnectedAccountsPopup({ accountToChangeStatus: account }, thisTab.id)
      updatePairs()
    } catch (err) {}
  }

  const handleDisconnectAccounts = async (pair: IConnectedAccountsPair) => {
    const disconnectedWallets = walletsForDisconnect.find((w) =>
      areSameAccounts([pair.firstAccount, pair.secondAccount], w)
    )
    const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    try {
      await openConnectedAccountsPopup(
        {
          accountsToDisconnect: disconnectedWallets
            ? disconnectedWallets
            : [pair.firstAccount, pair.secondAccount],
        },
        thisTab.id
      )
      updatePairs()
    } catch (err) {}
  }

  const handleConnectWallets = async () => {
    if (!walletsForConnect.length) return
    const {
      openConnectedAccountsPopup,
      getThisTab,
    }: {
      openConnectedAccountsPopup: (
        {
          bunchOfAccountsToConnect,
        }: { bunchOfAccountsToConnect: [IConnectedAccountUser, IConnectedAccountUser][] },
        id: number
      ) => Promise<void>
      getThisTab: () => Promise<{ id: number }>
    } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    try {
      await openConnectedAccountsPopup(
        {
          bunchOfAccountsToConnect: walletsForConnect,
        },
        thisTab.id
      )
      updatePairs()
    } catch (err) {}
  }

  return (
    <>
      {contractNetwork === NearNetworks.Testnet && (
        <div className={styles.warningInfo}>Connected Accounts are using a test network</div>
      )}
      <div
        className={cn(styles.overlayPaddings, {
          [styles.withWarning]: contractNetwork === NearNetworks.Testnet,
        })}
      >
        <div className={styles.caHeaderTop}>
          <h3>Accounts connected to:</h3>
          {/* <DropdownPreferredCANetwork /> */}
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '64%' }}>
            <DropdownCAListReceiver
              values={walletsReceivers}
              setter={setConnectedAccountsListReceiver}
              selected={connectedAccountsListReceiver}
            />
          </div>
          <div className={styles.connectWalletsBtnModule}>
            <button
              disabled={!walletsForConnect.length}
              className={styles.connectWalletsBtn}
              onClick={() => handleConnectWallets()}
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
        {isLoadingListDapplets ? (
          <TabLoader />
        ) : (
          <div className={styles.wrapper}>
            {!pairsToDisplay || pairsToDisplay.length === 0 ? (
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
                <div
                  className={cn(styles.scrollContent, {
                    [styles.withWarning]: contractNetwork === NearNetworks.Testnet,
                  })}
                >
                  {pairsToDisplay.map((x, i) => {
                    const statusLabel =
                      x.statusName === ConnectedAccountsPairStatus.Connected
                        ? Ok
                        : x.statusName === ConnectedAccountsPairStatus.Processing
                        ? Time
                        : Attention
                    const areWallets = areConnectedAccountsUsersWallets(
                      x.firstAccount,
                      x.secondAccount
                    )
                    const canDisconnectWallets =
                      walletsForDisconnect.length &&
                      walletsForDisconnect.some((w) =>
                        areSameAccounts(w, [x.firstAccount, x.secondAccount])
                      )

                    return (
                      <div key={i} className={styles.mainBlock}>
                        <div className={cn(styles.accountBlock, styles.accountBlockVertical)}>
                          <CAUserButton user={x.firstAccount} handleOpenPopup={handleOpenPopup} />
                          <CAUserButton user={x.secondAccount} handleOpenPopup={handleOpenPopup} />
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
                              (!areWallets &&
                                x.statusName !== ConnectedAccountsPairStatus.Connected) ||
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
              </div>
            )}
          </div>
        )}
      </div>
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

const areSameAccounts = (
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
