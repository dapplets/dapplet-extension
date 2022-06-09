import cn from 'classnames'
import React, { FC } from 'react'
import styles from './DappletInfo.module.scss'

export interface DappletInfoProps {
  title: string
  value: string
  appearance?: 'text' | 'hash' | 'link'
  className?: string
  onClick?: (x) => void
}

export const DappletInfo: FC<DappletInfoProps> = ({
  title,
  value,
  appearance = 'hash',
  className,
  onClick,
}: DappletInfoProps) => {
  const visible = ({
    value,
    appearance,
  }: Pick<DappletInfoProps, 'value' | 'appearance'>): string => {
    if (!value) return ''
    if (appearance === 'text' || appearance === 'link') return value

    const firstFourCharacters = value.substring(0, 10)
    const lastFourCharacters = value.substring(value.length - 1, value.length - 9)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const isLink = appearance === 'link'

  return (
    <div className={cn(styles.wrapper, className)}>
      <h6 className={styles.title}>{title}:</h6>
      {isLink ? (
        <a href={value} className={styles.value} target="_blank" rel="noreferrer">
          {visible({ appearance, value })}
        </a>
      ) : (
        <a onClick={onClick} data-title={value} className={styles.value}>
          {visible({ appearance, value })}
        </a>
      )}
    </div>
  )
}
