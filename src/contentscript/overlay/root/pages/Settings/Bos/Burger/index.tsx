import cn from 'classnames'
import React, { FC } from 'react'
import { ReactComponent as BurgerSvg } from '../assets/burger.svg'
import styles from './Burger.module.scss'
interface BurgerProps {
  navigate?: any
  pathname?: string
  onToggleClick: () => void
}
export const Burger: FC<BurgerProps> = (props) => {
  const { navigate, pathname, onToggleClick } = props
  const getNavigation = () => {
    if (
      document
        .querySelector('#dapplets-overlay-manager')
        ?.classList.contains('dapplets-overlay-collapsed')
    ) {
      if (pathname === '/system/settings') {
        onToggleClick()
      } else {
        onToggleClick()
        navigate('/system/settings')
      }
    } else {
      if (pathname !== '/system/dapplets') {
        navigate('/system/settings')
      }
    }
  }

  return (
    <button onClick={getNavigation} className={cn(styles.wrapper)}>
      <BurgerSvg />
    </button>
  )
}
