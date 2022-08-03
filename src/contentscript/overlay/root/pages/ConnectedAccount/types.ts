export enum Status {
  Processing = 'Processing',
  Connected = 'Connected',
  Error = 'Error',
}

export interface IUser {
  img: string
  name: string
  origin: string
  userActive: boolean
  accountActive: boolean
}

export interface IPair {
  firstAccount: IUser
  secondAccount: IUser
  statusName: Status
  statusLabel: string // Ok | Time | Attention
  statusMessage: string
  userActive: boolean
  closeness: number
}

export type TVerificationRequest = {
  firstAccount: string
  secondAccount: string
  isUnlink: boolean
  firstProofUrl: string
  secondProofUrl: string
  transactionSender: string
}

export type TAccountStatus = {
  isMain: boolean
}

export type TAccount = {
  id: string
  status: TAccountStatus
}
