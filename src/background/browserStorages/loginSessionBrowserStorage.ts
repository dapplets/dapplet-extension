import BaseBrowserStorage from './baseBrowserStorage'
import LoginSession from '../models/loginSession'

export default class LoginSessionBrowserStorage extends BaseBrowserStorage<LoginSession> { 
    constructor() {
        super(LoginSession, 'LoginSession');
    }
}