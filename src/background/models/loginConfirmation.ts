import Base from '../../common/models/base';

export default class LoginConfirmation extends Base {
    getId = () => this.loginConfirmationId;

    loginConfirmationId: string = null;
    authMethod: string = null;
    loginMessage: any = null;
    signature: any = null;
    
}