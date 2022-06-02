import { utils } from '@rjsf/core'
import { rangeSpec } from '@rjsf/core/lib/utils'
// import { Form } from 'semantic-ui-react'
// import {Form} from './index'
import cn from 'classnames'
import React, { useState } from 'react'
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
  const [i, setI] = useState(null)
  const _onChange = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value)
  const _onChangeN = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value)
  // const _onChangeNum = ({ currentTarget: { value } }) => {
  //   const newStep = String(i)
  //   // const newValue = String(Number(newStep) + Number(value))
  //   const q = Number(newStep)
  //   console.log(q)
  //   const w = Number(value)
  //   console.log(w)
  //   const e = q + w
  //   console.log(e)
  //   const r = 1

  //   // value = Number(newStep + value)
  //   value = String(r)
  //   console.log(value, 'newValue')
  //   onChange(value === '' ? options.emptyValue : value)
  //   console.log(value, 'value _onChangeNum')
  // }

  const _onChangeNum = ({ currentTarget: { value } }) => {
    // const newStep = +i

    let one = 0.5

    console.log(value, '1')
    console.log(schema.step, 'schema.step')
    let num = () => {
      const g = +value + one
      return g
    }
    console.log(num(), 'num')

    value = value + one
    console.log(value, 'newValue')
    onChange(value === '' ? options.emptyValue : value)
    console.log(value, 'value _onChangeNum')
  }
  // const _onChangeNum = () => value + i

  const _onBlur = () => onBlur && onBlur(id, value)
  const _onFocus = () => onFocus && onFocus(id, value)
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  )

  // console.log(step)
  // console.log(stepProps)

  // useEffect(() => {
  //   // _isMounted = true
  //   // const init = async () => {
  //   //   sV(value)
  //   // }
  //   // init()

  //   // console.log(i, 'i')

  //   console.log(value, 'value')

  //   console.log(step, 'step')

  //   // console.log(_onChangeNum(), '_onChangeNum')

  //   // return () => {
  //   //   _isMounted = false
  //   // }
  // }, [value, stepProps.step, value, step])
  // const q = () => {
  //   sV(value + i)
  // }
  // useEffect(() => {
  //   sV(value)
  // })

  return (
    <input
      className={cn(styles.inputOverlay, {
        [styles.inputOverlayNumber]: `${schema.type}` === 'number',
      })}
      key={id}
      id={id}
      placeholder={placeholder}
      type={schema.type === 'string' ? 'text' : `${schema.type}`}
      label={displayLabel ? label || schema.title : false}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      name={name}
      {...uiThemeProps}
      value={value || value === 0 ? value : ''}
      // value={v || v === 0 ? v : ''}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      step={step}
      // _onChangeNum={_onChangeNum}
      {...stepProps}
    />
  )
}
export default TextWidget
