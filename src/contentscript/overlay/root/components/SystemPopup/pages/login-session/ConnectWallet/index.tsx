import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { FC, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import base from '../../../components/Base.module.scss'
import styles from './ConnectWallet.module.scss'
interface Props {
  wallets: { id: string; label: string; icon: string }[]
  onWalletClick: (id: string) => void
}

export const ConnectWallet: FC<Props> = (p: Props) => {
  const [devMode, setMode] = useState(false)
  useEffect(() => {
    const init = async () => {
      await loadDevMode()
    }
    init()
    return () => {}
  }, [])

  const loadDevMode = async () => {
    const { getDevMode } = await initBGFunctions(browser)
    const devMode = await getDevMode()

    setMode(devMode)
  }
  return (
    <div className={styles.wrapper} data-testid="connect-wallet-to-extension-popup">
      <h2 className={base.title}>Connect new wallet</h2>

      <div className={styles.cryptoWallets}>
        <h3 className={base.subtitle}>select connection type</h3>
        <ul className={styles.list}>
          {p.wallets
            .filter(
              (x) =>
                x.label !== 'WalletConnect' &&
                (!devMode ? x.label !== 'Built-in Test Only Wallet' : x.label !== 'WalletConnect')
              // ToDo: ^^^ Attention! Hardcoded values! Move this logic from the UI-layer
            )
            .map(({ id, label, icon }) => (
              <li
                key={id}
                title={label}
                data-testid={`wallet-to-connect-${id}`}
                className={styles.item}
                onClick={() => p.onWalletClick(id)}
              >
                <img src={icon} alt={label} />
              </li>
            ))}
        </ul>
      </div>

      {/* <a href="#" className={cn(base.link, styles.FAQ)}>F.A.Q</a> */}
    </div>
  )
}
