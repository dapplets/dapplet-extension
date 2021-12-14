import { generateGuid } from '../../common/helpers';
import { ChainTypes, LoginRequest, WalletTypes } from '../../common/types';
import { WalletService } from './walletService';
import LoginSessionBrowserStorage from '../browserStorages/loginSessionBrowserStorage';
import LoginSession from '../models/loginSession';
import { OverlayService } from './overlayService';
import SessionEntryBrowserStorage from '../browserStorages/sessionEntryBrowserStorage';
import SessionEntry from '../models/sessionEntry';
import { toUtf8Bytes } from '@ethersproject/strings';
import { hexlify } from '@ethersproject/bytes';

const DEFAULT_REQUEST_TIMEOUT = 1000 * 60 * 60 * 24 * 7;

export class SessionService {

    private _loginSessionBrowserStorage = new LoginSessionBrowserStorage();
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
        const session = await this._loginSessionBrowserStorage.getById(sessionId);
        await this.clearItems(sessionId);
        await this._loginSessionBrowserStorage.deleteById(sessionId);
    }

    async createSession(moduleName: string, request: LoginRequest): Promise<LoginSession> {
        const timeout = request.timeout ?? DEFAULT_REQUEST_TIMEOUT;
        const secure = request.secureLogin ?? 'disabled';
        
        if (!['disabled', 'optional', 'required'].includes(secure)) throw new Error('Invalid "secureLogin" value.');

        const { wallet: walletType, chain } = await this._overlayService.openLoginSessionOverlay(moduleName, request.authMethods as ChainTypes[]);

        const session = new LoginSession();

        const creationDate = new Date();
        
        session.sessionId = generateGuid();
        session.moduleName = moduleName;
        session.authMethod = chain;
        session.walletType = walletType;
        session.expiresAt = new Date(creationDate.getTime() + timeout).toISOString();
        session.createdAt = creationDate.toISOString();

        // ToDo: secure login optional 
        if (secure === 'required') {
            const message = JSON.stringify({
                timeout: session.expiresAt,
                from: moduleName,
                role: request.role,
                help: request.help
            }, null, 2);
              
            const wallet = await this._walletService.getGenericWallet(chain, walletType);
            const signature = await wallet.signMessage(hexlify(toUtf8Bytes(message)));

            session.loginConfirmation = {
                loginMessage: message,
                signature: signature
            };
        }

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