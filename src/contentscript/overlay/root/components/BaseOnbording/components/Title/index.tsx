import cn from 'classnames'
import React, { FC } from 'react'
import { PagesTitle } from '../..'
import styles from './Title.module.scss'

export type TitleProps = {
  value: string
  setPage?: (x) => void
  step?: any
  isActive?: boolean
  setTitleOnbording: any
  setStep: any
}
export const stepIndicator = ['1', '2', '3', '4', '5']

export const Title: FC<TitleProps> = (props: TitleProps) => {
  const { value, setPage, step, setTitleOnbording, setStep, isActive } = props

  return (
    <div className={cn(styles.wrapper)}>
      <div className={styles.title}>{value}</div>
      <div className={styles.indicatorBlock}>
        {stepIndicator.map((x, i) => (
          <Indicator
            setPage={() => {
              if (+x === 1) {
                setTitleOnbording('Introduction')
                setStep('1')
                setPage(PagesTitle.PROMO)
              } else if (+x === 2) {
                setTitleOnbording('Step 1 of 3')
                setStep('2')
                setPage(PagesTitle.STEP_1)
              } else if (+x === 3) {
                setTitleOnbording('Step 2 of 3')
                setStep('3')
                setPage(PagesTitle.STEP_2)
              } else if (+x === 4) {
                setTitleOnbording('Step 3 of 3')
                setStep('4')
                setPage(PagesTitle.STEP_3)
              } else if (+x === 5) {
                setTitleOnbording('Congratulations')
                setStep('5')
                setPage(PagesTitle.END)
              }
            }}
            step={step}
            key={x}
            isActive={x === step ? true : false}
          />
        ))}
      </div>
    </div>
  )
}

export type IndicatorProps = {
  isActive?: boolean
  setPage?: any
  step?: any
}
export const Indicator: FC<IndicatorProps> = (props: IndicatorProps) => {
  const { isActive, setPage, step, ...otherProps } = props

  return (
    <div
      onClick={setPage}
      className={cn(styles.indicator, {
        [styles.indicatorActive]: isActive,
      })}
    ></div>
  )
}
