import { createContext } from 'react'
import { TAlertAndConfirmPayload } from '../../../../../../../common/types'

export interface ModalProps extends TAlertAndConfirmPayload {
  id: string
  onResolve: (value: boolean) => void
}

export type ModalContextState = {
  modals: ModalProps[]
  confirm: (payload: TAlertAndConfirmPayload) => Promise<boolean>
}

export const contextDefaultValues: ModalContextState = {
  modals: [],
  confirm: async () => false,
}

export const ModalContext = createContext(contextDefaultValues)
