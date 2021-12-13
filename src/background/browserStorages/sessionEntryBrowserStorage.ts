import BaseBrowserStorage from './baseBrowserStorage'
import SessionEntry from '../models/sessionEntry'

export default class SessionEntryBrowserStorage extends BaseBrowserStorage<SessionEntry> { 
    constructor() {
        super(SessionEntry, 'SessionEntry');
    }

    public async getBySessionKey(sessionId: string, key: string): Promise<SessionEntry> {
        return this.getById(sessionId + '/' + key);
    }

    public async deleteBySessionKey(sessionId: string, key: string): Promise<void> {
        return this.deleteBySessionKey(sessionId, key);
    }

    public async clearBySessionKey(sessionId: string): Promise<void> {
        const entries = await this.getAll(x => x.sessionId === sessionId);
        await Promise.all(entries.map(x => this.delete(x)));
    }
}