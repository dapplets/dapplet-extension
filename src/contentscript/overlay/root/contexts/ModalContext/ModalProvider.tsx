import React, { JSX, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { TAlertAndConfirmPayload } from '../../../../../common/types'
import { ModalContext, ModalContextState, ModalProps } from './ModalContext'

export const ModalProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
  const [modals, setModals] = useState<ModalProps[]>([])

  async function confirm(payload: TAlertAndConfirmPayload): Promise<boolean> {
    return new Promise((resolve) => {
      const id = Math.random().toString(16).slice(2)
      setModals((prevModals) => [
        ...prevModals,
        {
          ...payload,
          id,
          onResolve: (value: boolean) => {
            setModals((prevModals) => prevModals.filter((modal) => modal.id !== id))
            resolve(value)
          },
        },
      ])
    })
  }

  useEffect(() => {
    const addAlertOrConfirm = (message: { type: string; payload: TAlertAndConfirmPayload }) => {
      if (message?.type === 'ALERT_OR_CONFIRM') return confirm(message.payload)
    }
    browser.runtime.onMessage.addListener(addAlertOrConfirm)
    return () => browser.runtime.onMessage.removeListener(addAlertOrConfirm)
  }, [])

  const state: ModalContextState = {
    modals,
  }

  return <ModalContext.Provider value={state}>{children}</ModalContext.Provider>
}
