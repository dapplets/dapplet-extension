import Base from '../../common/models/base'

export default class LoginConfirmation extends Base {
  getId = () => this.loginConfirmationId

  loginConfirmationId: string = null

  authMethod: string = null
  wallet: string = null
  address: string = null
  timeout: string = null
  from: string = null
  role: string = null
  help: string = null

  signature: string = null
  contractId: string = null // ToDo: rethink this parameter, needed for NEAR only

  expiresAt: string = null
  createdAt: string = null

  isExpired() {
    const expiresAt = new Date(this.expiresAt).getTime()
    const now = Date.now()
    return expiresAt < now
  }

  loginMessage() {
    return JSON.stringify(
      {
        timeout: this.expiresAt,
        from: this.from,
        role: this.role,
        help: this.help,
      },
      null,
      2
    )
  }
}
