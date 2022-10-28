export type VerificationRequest = {
  firstAccount: string
  secondAccount: string
  isUnlink: boolean
  firstProofUrl: string
  secondProofUrl: string
  transactionSender: string
}

export type AccountStatus = {
  isMain: boolean
}

export type Account = {
  id: string
  status: AccountStatus
}
