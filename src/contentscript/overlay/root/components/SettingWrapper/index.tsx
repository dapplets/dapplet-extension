import React, { DetailedHTMLProps, HTMLAttributes, ReactElement } from 'react'
import styles from './SettingWrapper.module.scss'
import cn from 'classnames'

export interface SettingWrapperProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  title: string
}

export const SettingWrapper = (props: SettingWrapperProps): ReactElement => {
  const { title, children, className, ...anotherProps } = props

  return (
    <div className={cn(styles.wrapper, className)} {...anotherProps}>
      <h5 className={styles.title}>{title}</h5>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
