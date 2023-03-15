import cn from 'classnames'
import React from 'react'
import { resources } from '../../../../../common/resources'
import { IConnectedAccountUser } from '../../../../../common/types'
import styles from './CAUserButton.module.scss'

export const CAUserButton = ({
  user,
  onClick,
  maxLength = 32,
  color = 'white',
}: {
  user?: IConnectedAccountUser
  onClick?: (account: IConnectedAccountUser) => Promise<void>
  maxLength?: number
  color?: string
}) => {
  return (
    <div
      className={cn(styles.account, {
        [styles.nameUserActive]: user?.accountActive,
      })}
      style={{ backgroundColor: color }}
      onClick={onClick && (() => user && onClick(user))}
    >
      {user ? (
        <>
          <img src={resources[user.origin].icon} className={styles.imgUser} />
          <h4 className={styles.nameUser}>
            {user.name.length > maxLength
              ? user.name.slice(0, (maxLength - 2) / 2) +
                '...' +
                user.name.slice(-(maxLength - 4) / 2)
              : user.name}
          </h4>
        </>
      ) : (
        <>
          <div className={cn(styles.imgUser, styles.empty)}></div>
          <h4 className={styles.nameUser}>None</h4>
        </>
      )}
    </div>
  )
}
