import React, { ReactElement, ReactNode } from 'react'
import styles from './Message.module.scss'
import cn from 'classnames'

export interface MessageProps {
  title: string
  subtitle?: string
  link?: string
  linkText?: string
  children?: ReactNode
  className?: string
}

export const Message = ({
  title,
  subtitle,
  link,
  linkText,
  children,
  className,
}: MessageProps): ReactElement => {
  return (
    <div className={cn(styles.wrapper, className)}>
      <h6 className={styles.title}>{title}</h6>
      {subtitle?.length > 0 && <p className={styles.subtitle}>{subtitle}</p>}
      {children && <div className={styles.children}>{children}</div>}
      {link?.length > 0 && (
        <a href={link} className={styles.link}>
          {linkText}
        </a>
      )}
    </div>
  )
}
