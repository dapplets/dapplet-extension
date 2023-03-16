import cn from 'classnames'
import React, { ReactElement, ReactNode } from 'react'
import styles from './Message.module.scss'

export interface MessageProps {
  title: string
  subtitle?: string | ReactElement
  link?: string
  linkText?: string
  children?: ReactNode
  className?: string
  parentPage?: string
}

export const Message = ({
  title,
  subtitle,
  link,
  linkText,
  children,
  className,
  parentPage,
}: MessageProps): ReactElement => {
  return (
    <div className={cn(styles.wrapper, className)}>
      <h6
        className={cn(styles.title, {
          [styles.titleMessageTokenomics]: parentPage === 'tokenomics',
        })}
      >
        {title}
      </h6>
      {subtitle && typeof subtitle === 'string'
        ? subtitle?.length > 0 && (
            <p
              className={cn(styles.subtitle, {
                [styles.subTitleMessageTokenomics]: parentPage === 'tokenomics',
              })}
            >
              {subtitle}
            </p>
          )
        : subtitle}
      {children && <div className={styles.children}>{children}</div>}
      {link?.length > 0 && (
        <a href={link} className={styles.link}>
          {linkText}
        </a>
      )}
    </div>
  )
}
