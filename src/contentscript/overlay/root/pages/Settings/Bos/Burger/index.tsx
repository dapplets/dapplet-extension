import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Burger.module.scss'
import {ReactComponent as BurgerSvg }from '../assets/burger.svg'

export const Burger: FC = () => {
  return (
    <button className={cn(styles.wrapper)}>
      <BurgerSvg/>
    </button>
  )
}