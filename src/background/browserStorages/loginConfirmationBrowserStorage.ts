import BaseBrowserStorage from './baseBrowserStorage'
import LoginConfirmation from '../models/loginConfirmation'

export default class LoginConfirmationBrowserStorage extends BaseBrowserStorage<LoginConfirmation> { 
    constructor() {
        super(LoginConfirmation, 'LoginConfirmation');
    }
}