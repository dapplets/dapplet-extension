import cn from 'classnames'
import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC } from 'react'
import { ReactComponent as Pinned } from '../../assets/icons/iconsWidgetButton/pinned.svg'
import styles from './WidgetButton.module.scss'
export interface WidgetButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  title: string
  icon?: any
  disabled?: boolean
  pinned?: boolean
  hidden?: boolean
  isMenu?: boolean
  onClick?: any
}

export const WidgetButton: FC<WidgetButtonProps> = (props: WidgetButtonProps) => {
  const { title, icon, disabled, hidden, isMenu = false, pinned, onClick, ...otherProps } = props

  return (
    <div data-visible>
      {isMenu ? (
        <div
          className={cn(styles.menuWidgets, {
            [styles.widgetHidden]: hidden,
          })}
        >
          <div
            onClick={() => !disabled && onClick()}
            className={cn(styles.blockButtonInfo, {
              [styles.blockDisabled]: disabled,
            })}
          >
            <button
              data-visible
              className={cn(styles.widgetButton, {
                [styles.menuWidgetsButton]: isMenu,
              })}
              title={title ? title : null}
              disabled={disabled ? disabled : false}
              {...otherProps}
            >
              {icon && icon.length > 0 ? (
                <img className={cn(styles.widgetButtonImg)} src={icon} />
              ) : null}
            </button>
            <span className={styles.widgetButtonTitle}>{title}</span>
          </div>
          <button className={styles.widgetButtonPinned} data-visible>
            <Pinned />
          </button>
        </div>
      ) : (
        <button
          data-visible
          className={cn(styles.widgetButton, {
            [styles.widgetHidden]: hidden,
          })}
          title={title ? title : null}
          disabled={disabled ? disabled : false}
          {...otherProps}
        >
          {icon && icon.length > 0 ? (
            <img data-visible className={cn(styles.widgetButtonImg)} src={icon} />
          ) : null}
        </button>
      )}
    </div>
  )
}
