import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Avatar.module.scss'

export interface AvatarProps {
  avatar: string
  size: 'small' | 'big'
  className?: string
  onClick?: () => void
}

export const Avatar: FC<AvatarProps> = (props: AvatarProps) => {
  const { avatar, size, className = '', onClick } = props
  return (
    <div
      onClick={onClick}
      className={cn(
        styles.usersAvatars,
        {
          [styles.small]: size === 'small',
          [styles.big]: size === 'big',
        },
        className
      )}
    >
      <img src={avatar} alt="avatar" />
    </div>
  )
}
