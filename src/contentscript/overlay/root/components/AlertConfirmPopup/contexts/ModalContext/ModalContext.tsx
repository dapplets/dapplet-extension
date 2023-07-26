import { createContext } from 'react'
import { TAlertAndConfirmPayload } from '../../../../../../../common/types'

export interface ModalProps extends TAlertAndConfirmPayload {
  id: string
  onResolve: (value: boolean) => void
}

export type ModalContextState = {
  modals: ModalProps[]
}

export const contextDefaultValues: ModalContextState = {
  modals: [],
}

export const ModalContext = createContext(contextDefaultValues)
