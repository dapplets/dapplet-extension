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
  onPinned?: any
  pinnedId?: string
}

export const WidgetButton: FC<WidgetButtonProps> = (props: WidgetButtonProps) => {
  const {
    title,
    icon,
    disabled,
    hidden,
    isMenu = false,
    pinned,
    onPinned,
    onClick,
    ...otherProps
  } = props

  return (
    <div data-visible>
      {isMenu ? (
        <div
          data-testid="dapplet-active-menu"
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
          <button
            onClick={() => {
              onPinned()
            }}
            className={cn(styles.widgetButtonPinned, {
              [styles.isPinned]: pinned,
            })}
            data-visible
          >
            <Pinned />
          </button>
        </div>
      ) : (
        pinned && (
          <button
            data-testid="dapplet-active-button"
            data-visible
            className={cn(styles.widgetButton, {
              [styles.widgetHidden]: hidden,
            })}
            title={title ? title : null}
            disabled={disabled ? disabled : false}
            onClick={onClick}
            {...otherProps}
          >
            {icon && icon.length > 0 ? (
              <img data-visible className={cn(styles.widgetButtonImg)} src={icon} />
            ) : null}
          </button>
        )
      )}
    </div>
  )
}
