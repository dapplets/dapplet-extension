import cn from 'classnames'
import React, { ReactElement, useEffect } from 'react'
import Loader from '../../assests/loader.svg'
import styles from './Modal.module.scss'

interface IModalProps {
  visible: boolean
  title?: string
  content?: ReactElement | string
  accounts?: ReactElement
  footer: ReactElement | string
  onClose?: () => void
  className?: string
  classNameWrapper?: string
  id?: any
  isWaiting?: boolean
}

export const Modal = ({
  visible = false,
  title = '',
  content = '',
  accounts = null,
  footer = '',
  onClose,
  className,
  classNameWrapper,
  isWaiting = false,
}: IModalProps) => {
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
          {onClose ? <span className={styles.modalClose} onClick={onClose} /> : null}
        </div>
        {content && (
          <div className={styles.modalBody}>
            <div className={styles.modalContent}>{content}</div>
          </div>
        )}
        {accounts && (
          <div className={styles.modalAccounts}>
            {accounts}
            {isWaiting && <img src={Loader} className={styles.loader} />}
          </div>
        )}
        {!accounts && isWaiting && <img src={Loader} className={styles.loader} />}
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  )
}
