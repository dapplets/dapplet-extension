import React from 'react'
import cn from 'classnames'
import styles from './ConnectedAccountsModal.module.scss'
import { resources } from '../../../../../../../common/resources'
import { IConnectedAccountUser } from '../../../../../../../common/types'

const UserButton = ({ user }: { user: IConnectedAccountUser }) => {
  return (
    <div
      className={cn(styles.account, {
        [styles.nameUserActive]: user.accountActive,
      })}
    >
      <img src={resources[user.origin].icon} className={styles.imgUser} />
      <h4 className={styles.nameUser}>
        {user.name.length > 25 ? user.name.slice(0, 11) + '...' + user.name.slice(-11) : user.name}
      </h4>
    </div>
  )
}

export default UserButton
