export enum Status {
  Processing = 'Processing',
  Connected = 'Connected',
  Error = 'Error',
}

export interface IUser {
  img: string
  name: string
  origin: string
  accountActive: boolean
}

export interface IPair {
  firstAccount: IUser
  secondAccount: IUser
  statusName: Status
  statusMessage: string
  closeness: number
  pendingRequestId?: number
}

export type TVerificationRequest = {
  firstAccount: string
  secondAccount: string
  isUnlink: boolean
  firstProofUrl: string
  secondProofUrl: string
  transactionSender: string
}

type TAccountStatus = {
  isMain: boolean
}

export type TAccount = {
  id: string
  status: TAccountStatus
}
