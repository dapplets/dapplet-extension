import { resources } from '../../../../../../../../common/resources'
import { IConnectedAccountUser } from '../../../../../../../../common/types'

const areConnectedAccountsUsersWallets = (...users: IConnectedAccountUser[]) =>
  users.every((user) => resources[user.origin].type === 'wallet')

export default areConnectedAccountsUsersWallets
