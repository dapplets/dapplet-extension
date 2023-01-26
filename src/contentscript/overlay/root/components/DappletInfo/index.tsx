import cn from 'classnames'
import React, { FC } from 'react'
import useCopied from '../../hooks/useCopyed'
import styles from './DappletInfo.module.scss'
import { ReactComponent as Copy } from '../../assets/icons/copyShare.svg'

export interface DappletInfoProps {
  title: string
  value: string
  appearance?: 'text' | 'hash' | 'link'
  className?: string
  onClick?: any
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
    const lastFourCharacters = value.substring(value.length - 0, value.length - 9)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const isLink = appearance === 'link'

  const [, copy, setCopied] = useCopied(`${value}`)
  const copyText = () => {
    copy()

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className={cn(styles.wrapper, className)}>
      {value ? (
        <h6 data-title={`${value}`} onClick={copyText} className={styles.title}>
          {title}:
          <span className={styles.copied}>
            {value}
            <span className={styles.copiedIcon}><Copy/></span>
          </span>
        </h6>
      ) : null}

      {isLink ? (
        <a href={value} className={styles.value} target="_blank" rel="noreferrer">
          {visible({ appearance, value })}
        </a>
      ) : (
        <a onClick={onClick} className={styles.value}>
          {visible({ appearance, value })}
        </a>
      )}
    </div>
  )
}
