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
  otherSubtitle?: boolean
}

export const Message = ({
  title,
  subtitle,
  link,
  linkText,
  children,
  className,
  otherSubtitle,
}: MessageProps): ReactElement => {
  return (
    <div className={cn(styles.wrapper, className)}>
      <h6
        className={cn(styles.title, {
          [styles.otherTitle]: otherSubtitle,
        })}
      >
        {title}
      </h6>
      {subtitle && typeof subtitle === 'string'
        ? subtitle?.length > 0 && (
            <p
              className={cn(styles.subtitle, {
                [styles.otherSubtitle]: otherSubtitle,
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
