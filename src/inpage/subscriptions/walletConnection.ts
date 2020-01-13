import { Connection } from './connection';

export type WalletConnConfig = {
    dappletId: string
}

export class WalletConnection extends Connection<WalletConnConfig>{
    public send(msg: any): Promise<void> {
        return new Promise((resolve, reject) => resolve())
    }
}