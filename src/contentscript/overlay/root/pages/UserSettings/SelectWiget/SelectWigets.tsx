import { utils } from '@rjsf/core'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import { getSemanticProps } from '../utils'
// import './select.css'
import styles from './SelectWiget.module.scss'

const { asNumber, guessType } = utils

const nums = new Set(['number', 'integer'])

/**
 * * Returns and creates an array format required for semantic drop down
 * @param {array} enumOptions - array of items for the dropdown
 * @param {array} enumDisabled - array of enum option values to disable
 * @returns {*}
 */

function createDefaultValueOptionsForDropDown(enumOptions, enumDisabled) {
  const disabledOptions = enumDisabled || []
  let options = []
  // eslint-disable-next-line no-shadow

  options = _.map(enumOptions, ({ label, value, className }) => ({
    disabled: disabledOptions.indexOf(value) !== -1,
    key: label,
    text: label,
    className: className,
    value: value,
    styles,
  }))

  return options
}

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema, value) => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured

  const { type, items } = schema
  if (value === '') {
    return undefined
  } else if (type === 'array' && items && nums.has(items.type)) {
    return value.map(asNumber)
  } else if (type === 'boolean') {
    return value === 'true' || value === true
  } else if (type === 'number') {
    return asNumber(value)
  } else if (type === 'string') {
    return asNumber(value)
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x) => guessType(x) === 'number')) {
      return asNumber(value)
    } else if (schema.enum.every((x) => guessType(x) === 'boolean')) {
      return value === 'true'
    }
  }

  return value
}

const MyCustomWidget = (props, setNewValue) => {
  const ttOpt = props.options.enumOptions

  const options = [...ttOpt]
  return (
    <Select
      className={styles.inputSelect}
      options={options}
      // closeMenuOnSelect={false}
      placeholder={props.value}
      onChange={(e) => {
        setNewValue(e.value)
      }}
      name={props.name}
    />
  )
}

function SelectWidget(props) {
  const {
    schema,
    uiSchema,
    formContext,
    id,
    options,
    name,
    label,
    required,
    disabled,
    readonly,
    value,
    multiple,
    placeholder,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    formData,
  } = props
  const semanticProps = getSemanticProps({
    schema,
    uiSchema,
    formContext,
    options,
    defaultSchemaProps: {
      inverted: 'false',
      selection: true,
      fluid: true,
      scrolling: true,
      upward: false,
      'aria-live': false,
    },
  })
  const { enumDisabled, enumOptions } = options
  const emptyValue = multiple ? [] : ''
  const dropdownOptions = createDefaultValueOptionsForDropDown(enumOptions, enumDisabled)
  const _onChange = (
    event,

    { value }
  ) => {
    onChange && onChange(processValue(schema, value))
  }
  // eslint-disable-next-line no-shadow
  const _onBlur = ({ target: { value } }) => onBlur && onBlur(id, processValue(schema, value))
  const _onFocus = ({
    // eslint-disable-next-line no-shadow
    target: { value },
  }) => onFocus && onFocus(id, processValue(schema, value))

  const [newWalue, setNewValue] = useState(null)
  useEffect(() => {
    if (newWalue) {
      onChange(newWalue)
    }
  }, [newWalue])

  return MyCustomWidget(props, setNewValue)
}
export default SelectWidget
