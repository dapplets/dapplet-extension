import cn from 'classnames'
import React, { ReactElement, useEffect } from 'react'
import { CAUserButton } from '../../../CAUserButton'
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
        {isWaiting && <img src={Loader} className={styles.loader} />}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          {onClose ? <span className={styles.modalClose} onClick={onClose} /> : null}
        </div>
        {accounts && <div className={styles.modalAccounts}>{accounts}</div>}
        {content && (
          <div className={styles.modalBody}>
            {content.split('\n').map((t, i) => {
              const strChunks = t.split(/<[/u]*?>/g)
              return (
                <p key={i}>
                  {strChunks.map((s, j) =>
                    j % 2 === 0 ? (
                      s.includes('<info') ? (
                        <CAUserButton
                          key={(i + 31) * j * 100}
                          user={{
                            img: '',
                            name: s
                              .split(/<\/?info/g)[1]
                              .trim()
                              .split('>')[1],
                            origin: s
                              .split(/<\/?info/g)[1]
                              .trim()
                              .split('>')[0],
                            accountActive: false,
                          }}
                          info={true}
                        />
                      ) : (
                        s
                      )
                    ) : (
                      <span key={i * j * 1000} className={styles.underline}>
                        {s}
                      </span>
                    )
                  )}
                </p>
              )
            })}
          </div>
        )}
        <div className={styles.modalFooter}>
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
              styles.button,
              onConfirm && onConfirmLabel ? styles.secondary : styles.tertiary
            )}
          >
            {onConfirm && onConfirmLabel ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
