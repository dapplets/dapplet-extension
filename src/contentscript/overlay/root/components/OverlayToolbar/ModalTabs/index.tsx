import React, { ReactElement, useEffect } from 'react'
import styles from './ModalTabs.module.scss'
interface ModalTabsProps {
  visible: boolean
  content: ReactElement | string
  onClose: () => void
  classNameCLose: string
  onFewFunction?: any
}

export const ModalTabs = ({
  visible = false,
  content = '',
  onClose,

  classNameCLose,
  onFewFunction,
}: ModalTabsProps) => {
  const onKeydown = ({ key }: KeyboardEvent) => {
    switch (key) {
      case 'Escape':
        onClose()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  })

  if (!visible) return null

  return (
    <div className={styles.modal} onClick={onClose}>
      <span
        className={classNameCLose}
        onClick={() => {
          onFewFunction ? onFewFunction() : null
          onClose()
        }}
      />
      {content}
    </div>
  )
}
