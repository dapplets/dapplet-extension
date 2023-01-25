import { ReactElement } from 'react'

export interface SessionProps {
  providerIcon: string
  lastUsage: string
  accountIcon: string
  walletIcon: string
  account: string
  buttons: ReactElement[] | ReactElement
}
