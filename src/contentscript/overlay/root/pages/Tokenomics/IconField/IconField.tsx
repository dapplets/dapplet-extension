import cn from 'classnames'
import { useFormikContext } from 'formik'
import React, { useRef } from 'react'
import { ReactComponent as Folder } from '../../../assets/icons/tokenomics/folder.svg'
import { ReactComponent as Plus } from '../../../assets/icons/tokenomics/plus.svg'
import { ReactComponent as Refresh } from '../../../assets/icons/tokenomics/refresh.svg'
import Button from '../Button'
import styles from './IconField.module.scss'
import Preview from './Preview'

type IconFieldProps = {
  label: string
  disabled?: boolean
}

type Form = {
  icon: File | null
}

const IconField = ({ label, disabled }: IconFieldProps) => {
  const {
    values: { icon },
    errors,
    touched,
  } = useFormikContext<Form>()

  const { setFieldValue, setFieldTouched } = useFormikContext()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) return

    const iconFile = event.currentTarget.files[0]
    if (!iconFile) return

    setFieldValue('icon', iconFile)
    /* Yup bug bypass */
    setTimeout(() => setFieldTouched('icon', true))
  }

  const handleClick = () => {
    if (inputRef.current !== null) {
      inputRef.current.click()
    }
  }

  const isInvalidInput = errors.icon && touched.icon

  const isIconLoaded = icon || isInvalidInput

  const validIconButtonLable = icon ? (
    <span className={styles.success}>Good icon!</span>
  ) : (
    <span>PNG or SVG 128px*128px</span>
  )

  const invalidIconButtonLable = (
    <div
      data-testid="create-token-icon-field-error-message"
      className={cn(styles.errorMessage, styles.iconErrorMessage)}
    >
      {errors.icon}
    </div>
  )
  const getIcon = (x: boolean | undefined, handleClick: any) => {
    return () => {
      !x && handleClick()
    }
  }
  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor="file">
        {label}
      </label>

      <div className={styles.iconGroup}>
        <div
          onClick={getIcon(disabled, handleClick)}
          className={cn(styles.preview, {
            [styles.error]: errors.icon && touched.icon,
            [styles.disable]: disabled,
          })}
        >
          {icon && !errors.icon ? <Preview file={icon}></Preview> : <Plus />}
        </div>
        <div className={styles.buttonGroup}>
          <div className={styles.buttonLabel}>
            {errors.icon && touched.icon ? invalidIconButtonLable : validIconButtonLable}
          </div>
          <Button
            disabled={disabled}
            type="button"
            onClick={handleClick}
            primary
            outline
            className={styles.button}
          >
            {isIconLoaded ? <Refresh /> : <Folder />}
            {isIconLoaded ? 'Change icon' : 'Browse icon'}
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        hidden
        id="icon"
        name="icon"
        type="file"
        onChange={(event) => {
          handleChange(event)
        }}
      />
    </div>
  )
}

export default IconField
