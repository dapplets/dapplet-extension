import LoginSession from '../models/loginSession'
import BaseBrowserStorage from './baseBrowserStorage'

export default class LoginSessionBrowserStorage extends BaseBrowserStorage<LoginSession> {
  constructor() {
    super(LoginSession, 'LoginSession')
  }
}
