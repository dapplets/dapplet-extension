import React, { FC } from 'react'
import styles from './Profile.module.scss'
import cn from 'classnames'
import { Avatar } from '../Avatar'
import { ReactComponent as Down } from '../../assets/icons/down.svg'

export interface ProfileProps {
  avatar: string
  hash: string
  isOpen?: boolean
  open?: () => void
  onLogout?: () => void
  mini?: boolean
}

export const Profile: FC<ProfileProps> = (props: ProfileProps) => {
  const { avatar, hash, isOpen, onLogout, open, mini = false } = props

  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 5)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  return (
    <div className={styles.wrapper}>
      <header
        className={cn(styles.header, { [styles.mini]: mini })}
        onClick={open}
      >
        <Avatar avatar={avatar} size="big" className={styles.avatar} />
        {!mini && <p className={styles.hash}>{visible(hash)}</p>}
        {!mini && <Down />}
      </header>
      {isOpen && !mini && (
        <ul
          className={cn(styles.list, {
            [styles.isOpen]: isOpen,
          })}
        >
          <li onClick={onLogout} className={styles.item}>
            Log out
          </li>
        </ul>
      )}
    </div>
  )
}
