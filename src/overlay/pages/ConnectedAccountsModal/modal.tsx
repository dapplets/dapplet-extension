import cn from 'classnames'
import React, { ReactElement, useEffect } from 'react'
import Loader from '../../assests/loader.svg'
import styles from './Modal.module.scss'

interface IModalProps {
  title?: string
  content?: ReactElement | string
  accounts?: ReactElement
  onClose: () => void
  onConfirm?: () => Promise<void>
  onConfirmLabel?: string
  isWaiting?: boolean
}

export const Modal = ({
  title = '',
  content = '',
  accounts = null,
  onClose,
  onConfirm,
  onConfirmLabel,
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

  return (
    <div className={styles.modal} onClick={onClose}>
      <div
        className={cn(styles.modalDialog, styles.contentModal)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
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
        {onConfirm && onConfirmLabel && (
          <div className={styles.modalFooter}>
            <div className={styles.wrapperModalWantLink}>
              <button
                onClick={onConfirm}
                className={cn(styles.button, styles.primary)}
                disabled={isWaiting}
              >
                {onConfirmLabel}
              </button>
              <button
                onClick={onClose}
                className={cn(styles.button, styles.secondary)}
                disabled={isWaiting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
