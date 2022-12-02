import cn from 'classnames'
import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC, FunctionComponent } from 'react'
import styles from './WidgetButton.module.scss'

export interface WidgetButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
 title:string,
 icon?: any
disabled?:boolean,
pinned?:boolean
hidden?:boolean
}

export const WidgetButton: FC<WidgetButtonProps> = (props: WidgetButtonProps) => {
 const{title,icon ,disabled,hidden, ...otherProps}=props
  return (
    <button className={cn(styles.widgetButton,{
      [styles.widgetHidden]:hidden
    })}  title={title?title:null} disabled={disabled?disabled:false} {...otherProps} >{icon &&icon.length > 0? <img className={cn(styles.widgetButtonImg)} src={icon}/>:null}</button>
  )
}
