import cn from 'classnames'
import React from 'react'
import { resources } from '../../../../../../../common/resources'
import { IConnectedAccountUser } from '../../../../../../../common/types'
import styles from './ConnectedAccountsModal.module.scss'

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
