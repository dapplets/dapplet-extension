import Base from '../../common/models/base';

export default class LoginSession extends Base {
    getId = () => this.sessionId;

    sessionId: string = null;
    moduleName: string = null;
    authMethod: string = null;
    walletType: string = null;
    expiresAt: string = null;
    createdAt: string = null;
    loginConfirmationId: string = null;

    isExpired() {
        const expiresAt = new Date(this.expiresAt).getTime();
        const now = Date.now();
        return expiresAt < now;
    }
}