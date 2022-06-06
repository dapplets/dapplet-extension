import { utils } from '@rjsf/core'
import { rangeSpec } from '@rjsf/core/lib/utils'
// import { Form } from 'semantic-ui-react'
// import {Form} from './index'
import cn from 'classnames'
import React from 'react'
import { getSemanticProps } from '../utils'
// import './textWiget.css'
import styles from './TextWiget.module.scss'
// const Form = JSONSchemaForm.default;

const { getDisplayLabel } = utils
let _isMounted = false

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
  } = props
  const uiThemeProps = getSemanticProps({ formContext, options, uiSchema })

  // eslint-disable-next-line no-shadow

  const step = schema.type === 'number' ? 'any' : undefined // non-integer numbers shouldn't have a default step of 1
  const stepProps = rangeSpec(schema) // sets step, min, and max from the schema

  const _onChange = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value)

  const _onChangeNum = ({ currentTarget: { value } }) => {
    let num = 0.5
    value = `${num}`
    onChange(value === '' ? options.emptyValue : value)
    console.log(value, '_onChangeNum')
  }

  const _onChangeDec = ({ currentTarget: { value } }) =>
    onChange(value === '' ? options.emptyValue : value)

  const _onBlur = () => onBlur && onBlur(id, value)
  const _onFocus = () => onFocus && onFocus(id, value)
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  )

  console.log(value)

  return (
    <>
      {/* <button value={value || value === 0 ? value : ''} onClick={_onChangeNum}>
        +
      </button> */}
      <input
        className={cn(styles.inputOverlay, {
          [styles.inputOverlayNumber]: `${schema.type}` === 'number',
        })}
        key={id}
        id={id}
        placeholder={value}
        type={schema.type === 'string' ? 'text' : `${schema.type}`}
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
        // _onChangeNum={_onChangeNum}
        {...stepProps}
      />
      {/* <button value={stepProps.step} onChange={_onChangeDec}>
        -
      </button> */}
    </>
  )
}
export default TextWidget
