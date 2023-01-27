import cn from 'classnames'
import React, { ReactElement, useEffect } from 'react'
import Loader from '../../assests/loader.svg'
import styles from './Modal.module.scss'

interface IModalProps {
  title?: string
  content?: string
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
        style={{ paddingTop: isWaiting ? '0' : '46px' }}
      >
        {/* {!accounts && isWaiting && <img src={Loader} className={styles.loader} />} */}
        {isWaiting && <img src={Loader} className={styles.loader} />}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          {onClose ? <span className={styles.modalClose} onClick={onClose} /> : null}
        </div>
        {accounts && <div className={styles.modalAccounts}>{accounts}</div>}
        {content && (
          <div className={styles.modalBody}>
            {/* <div className={styles.modalContent}>{content}</div> */}
            {content.split('\n').map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
        )}
        <div className={styles.modalFooter}>
          {/* <div className={styles.wrapperModalWantLink}> */}
          {onConfirm && onConfirmLabel && !isWaiting && (
            <button
              onClick={onConfirm}
              className={cn(styles.button, styles.primary)}
              disabled={isWaiting}
            >
              {onConfirmLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className={cn(
              onConfirm && onConfirmLabel && styles.button,
              onConfirm && onConfirmLabel ? styles.secondary : styles.tertiary
            )}
            // disabled={isWaiting}
          >
            {onConfirm && onConfirmLabel ? 'Cancel' : 'Close'}
          </button>
          {/* </div> */}
        </div>
      </div>
    </div>
  )
}
