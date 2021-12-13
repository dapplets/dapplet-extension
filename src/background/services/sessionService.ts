import { generateGuid } from '../../common/helpers';
import { ChainTypes, LoginRequest } from '../../common/types';
import { WalletService } from './walletService';
import LoginSessionBrowserStorage from '../browserStorages/loginSessionBrowserStorage';
import LoginConfirmationBrowserStorage from '../browserStorages/loginConfirmationBrowserStorage';
import LoginSession from '../models/loginSession';
import { OverlayService } from './overlayService';
import SessionEntryBrowserStorage from '../browserStorages/sessionEntryBrowserStorage';
import SessionEntry from '../models/sessionEntry';

const DEFAULT_REQUEST_TIMEOUT = 1000 * 60 * 60 * 24 * 7;

export class SessionService {

    private _loginSessionBrowserStorage = new LoginSessionBrowserStorage();
    private _loginConfirmationBrowserStorage = new LoginConfirmationBrowserStorage();
    private _sessionEntryBrowserStorage = new SessionEntryBrowserStorage();

    constructor(
        private _walletService: WalletService, 
        private _overlayService: OverlayService
    ) { }

    async getSessions(moduleName: string): Promise<LoginSession[]> {
        const sessions = await this._loginSessionBrowserStorage.getAll(x => x.moduleName === moduleName);
        return sessions.filter(x => !x.isExpired());
    }

    async getSession(sessionId: string): Promise<LoginSession> {
        return await this._loginSessionBrowserStorage.getById(sessionId);
    }

    async isValidSession(sessionId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        if (!session) return false;
        if (session.isExpired()) return false;
        return true;
    }

    async killSession(sessionId: string): Promise<void> {
        await this._loginSessionBrowserStorage.deleteById(sessionId);
        await this.clearItems(sessionId);
    }

    async createSession(moduleName: string, request: LoginRequest): Promise<LoginSession> {
        const descriptors = await this._walletService.getWalletDescriptors();
        const authMethod = request.authMethods[0]; // ToDo: array of methods
        const isSuitableWallet = descriptors.filter(x => x.chain === authMethod && x.connected === true).length > 0;

        if (!isSuitableWallet) {
            await this._overlayService.pairWalletViaOverlay(authMethod as ChainTypes);
        }

        const walletType = await this._overlayService.openLoginSessionOverlay(moduleName, authMethod as ChainTypes);

        const session = new LoginSession();

        const creationDate = new Date();
        const timeout = request.timeout ?? DEFAULT_REQUEST_TIMEOUT;
        
        session.sessionId = generateGuid();
        session.moduleName = moduleName;
        session.authMethod = authMethod;
        session.walletType = walletType;
        session.expiresAt = new Date(creationDate.getTime() + timeout).toISOString();
        session.createdAt = creationDate.toISOString();
        // session.loginConfirmationId = null;

        await this._loginSessionBrowserStorage.create(session);

        return session;
    }

    async getItem(sessionId: string, key: string): Promise<any> {
        return this._sessionEntryBrowserStorage.getBySessionKey(sessionId, key);
    }

    async setItem(sessionId: string, key: string, value: any): Promise<void> {
        const sessionEntry = new SessionEntry();
        sessionEntry.sessionId = sessionId;
        sessionEntry.key = key;
        sessionEntry.value = value;
        await this._sessionEntryBrowserStorage.create(sessionEntry);
    }

    async removeItem(sessionId: string, key: string): Promise<void> {
        return this._sessionEntryBrowserStorage.deleteBySessionKey(sessionId, key);
    }

    async clearItems(sessionId: string): Promise<void> {
        return this._sessionEntryBrowserStorage.clearBySessionKey(sessionId);
    }
}