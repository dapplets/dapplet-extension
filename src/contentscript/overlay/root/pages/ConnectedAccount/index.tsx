import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../common/global-event-bus'
import { resources } from '../../../../../common/resources'
import {
  ConnectedAccountsPairStatus,
  IConnectedAccountsPair,
  IConnectedAccountUser,
  WalletDescriptor,
  ChainTypes,
  WalletTypes,
} from '../../../../../common/types'
import { Message } from '../../components/Message'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
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
      <img src={resources[user.origin].icon} className={styles.imgUser} />
      <h4 className={styles.nameUser}>
        {user.name.length > 15 ? user.name.slice(0, 6) + '...' + user.name.slice(-4) : user.name}
      </h4>
    </div>
  )
}

export const ConnectedAccount = () => {
  const [pairs, setPairs] = useState<IConnectedAccountsPair[]>([])
  const [walletsForConnect, setWalletsForConnect] = useState<
    [IConnectedAccountUser, IConnectedAccountUser] | []
  >([])
  const [isLoadingListDapplets, setLoadingListDapplets] = useState(true)
  const abortController = useAbortController()

  const findWalletsToConnect = async (): Promise<void> => {
    const { getWalletDescriptors, getConnectedAccountStatus } = await initBGFunctions(browser)
    const descriptors: WalletDescriptor[] = await getWalletDescriptors()
    const connectedWalletsDescriptors = descriptors.filter((d) => d.connected === true)
    console.log('connectedWalletsDescriptors', connectedWalletsDescriptors)
    if (!connectedWalletsDescriptors.length) {
      setWalletsForConnect([])
      return
    }
    const connectedEthWallet = connectedWalletsDescriptors.filter(
      (d: WalletDescriptor) =>
        d.type === WalletTypes.METAMASK &&
        (d.chain === ChainTypes.ETHEREUM_GOERLI || d.chain === ChainTypes.ETHEREUM_XDAI)
    )[0]
    if (!connectedEthWallet) {
      setWalletsForConnect([])
      return
    }
    const connectedNearTestWallet = connectedWalletsDescriptors.filter(
      (d: WalletDescriptor) => d.chain === ChainTypes.NEAR_TESTNET
    )[0]
    if (!connectedNearTestWallet) {
      setWalletsForConnect([])
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
        connectedNearTestWallet.account,
        ChainTypes.NEAR_TESTNET
      )
      const connectedAccountUser2: IConnectedAccountUser = {
        img: resources['near/testnet'].icon,
        name: connectedNearTestWallet.account,
        origin: ChainTypes.NEAR_TESTNET,
        accountActive: status2,
      }
      setWalletsForConnect([connectedAccountUser1, connectedAccountUser2])
    }

    if (!pairs.length) {
      await setAccounts()
      return
    }
    for (const pair of pairs) {
      if (
        (pair.firstAccount.name === connectedEthWallet.account &&
          pair.firstAccount.origin === 'ethereum' &&
          pair.secondAccount.name === connectedNearTestWallet.account &&
          pair.secondAccount.origin === 'near/testnet') ||
        (pair.secondAccount.name === connectedEthWallet.account &&
          pair.secondAccount.origin === 'ethereum' &&
          pair.firstAccount.name === connectedNearTestWallet.account &&
          pair.firstAccount.origin === 'near/testnet')
      ) {
        {
          setWalletsForConnect([])
          return
        }
      }
    }
    setAccounts()
  }

  const updatePairs = async (prevPairs?: IConnectedAccountsPair[]) => {
    const { getConnectedAccountsPairs, execConnectedAccountsUpdateHandler } = await initBGFunctions(
      browser
    )
    const newPairs: IConnectedAccountsPair[] = await getConnectedAccountsPairs({ prevPairs })
    if (!abortController.signal.aborted) {
      setPairs(newPairs)
    }

    await findWalletsToConnect()

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
    updatePairs().then(() => {
      if (!abortController.signal.aborted) {
        setLoadingListDapplets(false)
      }
    })

    EventBus.on('wallet_changed', updatePairs)
    return () => {
      EventBus.off('wallet_changed', updatePairs)
    }
  }, [abortController.signal.aborted])

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
    if (!walletsForConnect.length) return
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
          accountsToConnect: walletsForConnect,
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
          <button
            disabled={!walletsForConnect.length}
            className={styles.connectWalletsBtn}
            onClick={() => handleConnectAccounts()}
          >
            Connect wallets
          </button>
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
                <h3 style={{ paddingLeft: '1em' }}>Accounts</h3>
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
                        // (x.firstAccount.name + x.secondAccount.name).length > 30
                        //   ? styles.accountBlockVertical
                        //   : styles.accountBlockHorizontal
                        // styles.accountBlockHorizontal
                        styles.accountBlockVertical
                      )}
                    >
                      <UserButton user={x.firstAccount} handleOpenPopup={handleOpenPopup} />
                      {/* <span className={styles.arrowsAccount} /> */}
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
                      {/* </div>
                    <div className={cn(styles.accountDelete)}> */}
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
