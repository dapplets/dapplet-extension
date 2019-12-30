import { Connection } from './connection';

export type WalletConnConfig = {
    url: string
    title: string
    tabId?: any
}

export class WalletConnection extends Connection<WalletConnConfig>{
    public send(msg: any): Promise<void> {
        return new Promise((resolve, reject) => resolve())
    }
}