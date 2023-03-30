import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Title.module.scss'

export type TitleProps = {
  value: string
  isActive?: boolean
  step?: any
}
export const stepIndicator = ['1', '2', '3']

export const Title: FC<TitleProps> = (props: TitleProps) => {
  const { value, isActive, step } = props

  return (
    <div className={cn(styles.wrapper)}>
      <div className={styles.title}>{value}</div>
      <div className={styles.indicatorBlock}>
        {stepIndicator.map((x, i) => (
          <Indicator key={x} isActive={x === step ? true : false} />
        ))}
      </div>
    </div>
  )
}

export type IndicatorProps = {
  isActive?: boolean
}
export const Indicator: FC<IndicatorProps> = (props: IndicatorProps) => {
  const { isActive } = props

  return (
    <div
      className={cn(styles.indicator, {
        [styles.indicatorActive]: isActive,
      })}
    ></div>
  )
}
