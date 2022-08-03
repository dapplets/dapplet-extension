import cn from 'classnames'
import React, { ReactElement, useEffect } from 'react'
import styles from './Modal.module.scss'

interface ModalProps {
  visible: boolean
  title?: string
  content: ReactElement | string
  footer: ReactElement | string
  onClose?: () => void
  className?: string
  classNameWrapper?: string
  id?: any
  classNameContent?: string
  onFewFunction?: any
}

export const Modal = ({
  visible = false,
  title = '',
  content = '',
  footer = '',
  onClose,
  className,
  classNameWrapper,
  classNameContent,
  onFewFunction,
}: ModalProps) => {
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
      <div
        className={cn(styles.modalDialog, classNameWrapper)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={cn(styles.modalTitle, className)}>{title}</h3>
          {onClose ? (
            <span
              className={styles.modalClose}
              onClick={() => {
                onFewFunction ? onFewFunction() : null
                onClose()
              }}
            />
          ) : null}
        </div>
        <div className={cn(styles.modalBod, classNameContent)}>
          <div className={styles.modalContent}>{content}</div>
        </div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  )
}
