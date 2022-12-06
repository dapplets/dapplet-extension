import cn from 'classnames'
import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC, FunctionComponent } from 'react'
import styles from './WidgetLabel.module.scss'

export interface LabelProps {
 title:string,
icon?:string,
hidden?:boolean,
pinned?:boolean
}

export const LabelButton: FC<LabelProps> = (props: LabelProps) => {
 const{title,icon,hidden=false, ...otherProps}=props
  return (
    <span  className={cn(styles.widgetLabel,{
      [styles.widgetHidden]:hidden
    })}  title={title?title:null}  {...otherProps} >{icon &&icon.length > 0? <img className={cn(styles.widgetLabelImg)} src={icon}/>:null}</span>
  )
}
