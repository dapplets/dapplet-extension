import cn from 'classnames'
import React, { FC } from 'react'
import { DappletActionProps } from '../../hooks/useDappletActions'
import styles from './WidgetLabel.module.scss'

export interface LabelProps {
  action: DappletActionProps
}

export const LabelButton: FC<LabelProps> = (props: LabelProps) => {
  const { title = null, icon = null, hidden = false } = props.action

  return (
    <span
      className={cn(styles.widgetLabel, {
        [styles.widgetHidden]: hidden,
      })}
      title={title}
    >
      {icon && icon.length > 0 ? <img className={cn(styles.widgetLabelImg)} src={icon} /> : null}
    </span>
  )
}
