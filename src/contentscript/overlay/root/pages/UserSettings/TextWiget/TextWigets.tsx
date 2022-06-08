import { utils } from '@rjsf/core'
import { rangeSpec } from '@rjsf/core/lib/utils'

import cn from 'classnames'
import React, { useEffect } from 'react'

import { getSemanticProps } from '../utils'

import styles from './TextWiget.module.scss'
// import Select from 'react-select';

const { getDisplayLabel } = utils
let _isMounted = false

const MyCustomWidget = (props, step) => {
  return (
    <div className={styles.inputBlockNumber}>
      <button
        className={styles.buttonMin}
        value={props.value}
        disabled={props.value <= step.min}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const newValue = Number(+e.currentTarget.value - Number(step.step)).toFixed(2)
          props.onChange(String(newValue))
        }}
      />

      <input
        type="number"
        className={cn(styles.inputOverlay, styles.inputOverlayNumber)}
        value={props.value}
        required={props.required}
        onChange={(event) => {
          event.preventDefault()
          event.stopPropagation()
          props.onChange(event.target.value)
        }}
      />
      <button
        className={styles.buttonMax}
        value={props.value}
        disabled={props.value >= step.max}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const newValue = Number(+e.currentTarget.value + Number(step.step)).toFixed(2)
          console.log(newValue)

          props.onChange(String(newValue))
        }}
      />
    </div>
  )
}

const widgets = {
  myCustomWidget: MyCustomWidget,
}

const NewuiSchema = {
  'ui:widget': 'myCustomWidget',
}

function TextWidget(props) {
  const {
    id,
    placeholder,
    name,
    label,
    value,
    required,
    readonly,
    disabled,
    onChange,

    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    formContext,
    formData,
  } = props

  const uiThemeProps = getSemanticProps({ formContext, options, uiSchema })

  const step = schema.type === 'number' ? 'any' : undefined
  const stepProps = rangeSpec(schema)

  const _onChange = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value)

  const _onBlur = () => onBlur && onBlur(id, value)
  const _onFocus = () => onFocus && onFocus(id, value)
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  )

  useEffect(() => {
    _isMounted = true
    const init = async () => {}
    init()

    return () => {
      _isMounted = false
    }
  }, [])
  // console.log(stepProps)
  // console.log(value)

  return (
    <>
      {schema.type === 'number' ? (
        MyCustomWidget(props, stepProps)
      ) : (
        <input
          className={cn(styles.inputOverlay, {})}
          key={id}
          id={id}
          placeholder={value}
          type={'text'}
          label={displayLabel ? label || schema.title : false}
          required={required}
          autoFocus={autofocus}
          disabled={disabled || readonly}
          name={name}
          {...uiThemeProps}
          value={value || value === 0 ? value : ''}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
          step={step}
          {...stepProps}
        />
      )}
    </>
  )
}
export default TextWidget
