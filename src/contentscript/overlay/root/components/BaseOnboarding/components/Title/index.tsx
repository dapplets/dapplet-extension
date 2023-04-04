import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Title.module.scss'

export type TitleProps = {
  title: string
  stepsNumber: number
  currentStep: number
  onStepChange: (stepIndex: number) => void
}

export const Title: FC<TitleProps> = (props: TitleProps) => {
  const { title, stepsNumber, currentStep, onStepChange } = props

  return (
    <div className={cn(styles.wrapper)}>
      <div className={styles.title}>{title}</div>
      <div className={styles.indicatorBlock}>
        {Array.from(Array(stepsNumber).keys()).map((stepIndex) => (
          <Indicator
            key={stepIndex}
            isActive={stepIndex === currentStep}
            onClick={() => onStepChange(stepIndex)}
          />
        ))}
      </div>
    </div>
  )
}

export type IndicatorProps = {
  isActive: boolean
  onClick: () => void
}

export const Indicator: FC<IndicatorProps> = (props: IndicatorProps) => {
  const { isActive, onClick } = props

  return (
    <div
      onClick={onClick}
      className={cn(styles.indicator, {
        [styles.indicatorActive]: isActive,
      })}
    ></div>
  )
}
