import cn from 'classnames'
import React from 'react'
import { resources } from '../../../../../common/resources'
import { IConnectedAccountUser } from '../../../../../common/types'
import styles from './CAUserButton.module.scss'

export const CAUserButton = ({
  user,
  handleOpenPopup,
  maxLength = 32,
  colour = 'white',
}: {
  user?: IConnectedAccountUser
  handleOpenPopup?: (account: IConnectedAccountUser) => Promise<void>
  maxLength?: number
  colour?: string
}) => {
  return (
    <div
      className={cn(styles.account, {
        [styles.nameUserActive]: user?.accountActive,
      })}
      style={{ backgroundColor: colour }}
      onClick={handleOpenPopup && (() => user && handleOpenPopup(user))}
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
