import LoginConfirmation from '../models/loginConfirmation'
import BaseBrowserStorage from './baseBrowserStorage'

export default class LoginConfirmationBrowserStorage extends BaseBrowserStorage<LoginConfirmation> {
  constructor() {
    super(LoginConfirmation, 'LoginConfirmation')
  }
}
