import React, { FC } from 'react'
import ReactTimeAgo from 'react-time-ago'
import styles from './Session.module.scss'
import { SessionProps } from './Session.props'
import { cutString } from '../../../../helpers/cutString'

export const Session: FC<SessionProps> = (p: SessionProps) => {
 
  return (
    <div className={styles.session}>
      <div className={styles.wrapper}>
        <img className={styles.iconLogin} src={p.accountIcon} />

        <div className={styles.inner}>
          <h3 title={p.account} className={styles.hash}>
            {cutString(p.account)}
          </h3>

          <div className={styles.info}>
            <ul className={styles.icons}>
              {p.providerIcon ? <img src={p.providerIcon} className={styles.icon} /> : null}
              {p.walletIcon ? <img src={p.walletIcon} className={styles.icon} /> : null}
            </ul>
            {p.lastUsage && (
              <span className={styles.time}>
                <ReactTimeAgo date={new Date(p.lastUsage)} locale="en-US" />
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.buttons}>
        {Array.isArray(p.buttons)
          ? p.buttons.map((item, index) => <div key={index}>{item}</div>)
          : p.buttons}
      </div>
    </div>
  )
}
