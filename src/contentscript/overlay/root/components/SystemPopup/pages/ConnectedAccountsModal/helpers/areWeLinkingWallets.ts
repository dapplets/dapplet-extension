import { resources } from '../../../../../../../../common/resources'
import { IConnectedAccountUser } from '../../../../../../../../common/types'

const areWeLinkingWallets = (
  firstAccount: IConnectedAccountUser,
  secondAccount: IConnectedAccountUser
) =>
  !resources[firstAccount.origin].proofUrl(firstAccount.name) &&
  !resources[secondAccount.origin].proofUrl(secondAccount.name) &&
  resources[firstAccount.origin].type === 'wallet' &&
  resources[secondAccount.origin].type === 'wallet'

export default areWeLinkingWallets
