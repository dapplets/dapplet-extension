import React, { FC } from 'react'
import base from '../../../components/Base.module.scss'
import styles from './ConnectWallet.module.scss'

interface Props {
  wallets: { id: string; label: string; icon: string }[]
  onWalletClick: (id: string) => void
}

export const ConnectWallet: FC<Props> = (p: Props) => {
  return (
    <div className={styles.wrapper}>
      <h2 className={base.title}>Connect new wallet</h2>

      <div className={styles.cryptoWallets}>
        <h3 className={base.subtitle}>select connection type</h3>
        <ul className={styles.list}>
          {p.wallets.map(({ id, label, icon }) => {
            //  TODO delete!
            if (id === 'near_testnet') return
            return (
              <li
                key={id}
                title={label}
                className={styles.item}
                onClick={() => p.onWalletClick(id)}
              >
                <img src={icon} alt={label} />
              </li>
            )
          })}
        </ul>
      </div>

      {/* <a href="#" className={cn(base.link, styles.FAQ)}>F.A.Q</a> */}
    </div>
  )
}
