import cn from 'classnames'
import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC } from 'react'
import { ReactComponent as Pinned } from '../../assets/icons/iconsWidgetButton/pinned.svg'
import { DappletActionProps } from '../../hooks/useDappletActions'
import styles from './WidgetButton.module.scss'

export interface WidgetButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  action: DappletActionProps
  isMenu?: boolean
}

export const WidgetButton: FC<WidgetButtonProps> = (props: WidgetButtonProps) => {
  const { isMenu = false, ...otherProps } = props
  const {
    title,
    icon,
    disabled = false,
    onPinned,
    hidden = false,
    pinned = false,
    pinId,
    onClick,
  } = props.action

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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              !disabled && onClick()
            }}
            className={cn(styles.blockButtonInfo, {
              [styles.blockDisabled]: disabled,
            })}
          >
            <button
              data-testid={pinned ? 'button-pinned' : 'button-not-pinned'}
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
          {pinId ? (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPinned()
              }}
              className={cn(styles.widgetButtonPinned, {
                [styles.isPinned]: pinned,
                // 'pinned': pinned
              })}
              data-visible
              data-testid="pinned"
            >
              <Pinned />
            </button>
          ) : null}
        </div>
      ) : (
        pinned && (
          <button
            data-testid="dapplet-active-button"
            data-visible
            className={cn(styles.widgetButton, {
              [styles.widgetHidden]: hidden,
              [styles.widgetDisabled]: disabled,
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
