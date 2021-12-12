import BaseBrowserStorage from './baseBrowserStorage'
import LoginConfirmation from '../models/loginSession'

export default class LoginConfirmationBrowserStorage extends BaseBrowserStorage<LoginConfirmation> { 
    constructor() {
        super(LoginConfirmation, 'LoginConfirmation');
    }
}