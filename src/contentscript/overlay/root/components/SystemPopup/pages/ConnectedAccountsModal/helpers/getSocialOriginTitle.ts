import { resources } from '../../../../../../../../common/resources'
import { IConnectedAccountUser } from '../../../../../../../../common/types'

const getSocialOriginTitle = ([firstAccount, secondAccount]: IConnectedAccountUser[]) =>
  resources[firstAccount.origin].type === 'social'
    ? resources[firstAccount.origin].title
    : resources[secondAccount.origin].title

export default getSocialOriginTitle
