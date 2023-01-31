import cn from 'classnames'
import React, { FC, ReactElement } from 'react'
import { ReactComponent as Load } from '../../assests/loader.svg'
import base from '../Base.module.scss'
import { Button } from '../Button'
import styles from './Loading.module.scss'

interface LoadingProps {
  title: string
  subtitle: string
  content?: ReactElement
  onBackButtonClick: () => void
}

export const Loading: FC<LoadingProps> = ({
  title,
  subtitle,
  content,
  onBackButtonClick,
}: LoadingProps) => {
  return (
    <div className={styles.wrapper}>
      <h2 className={base.title}>{title}</h2>
      <p className={cn(base.subtitle, styles.subtitle)}>{subtitle}</p>

      {content ?? (
        <div className={styles.loading}>
          <Load />
        </div>
      )}

      <Button basic onClick={onBackButtonClick}>
        Back
      </Button>
    </div>
  )
}
