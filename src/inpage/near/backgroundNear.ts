import { Connection, InMemorySigner, Near, keyStores } from "near-api-js";
import { BackgroundJsonRpcProvider } from "./backgroundJsonRpcProvider";
import { BackgroundKeyStore } from "./backgroundKeyStore";

export class BackgroundNear extends Near {
    constructor(app: string) {
        super({
            networkId: 'default',
            nodeUrl: 'https://rpc.testnet.near.org',
            walletUrl: 'https://wallet.testnet.near.org',
            helperUrl: 'https://helper.testnet.near.org',
            deps: { keyStore: new BackgroundKeyStore() }
        });

        const provider = new BackgroundJsonRpcProvider(app);
        const keystore = new BackgroundKeyStore();
        const signer = new InMemorySigner(keystore);
        const connection = new Connection('default', provider, signer);
        Object.defineProperty(this, 'connection', {
            value: connection
        });
    }
}