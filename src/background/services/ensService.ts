import { WalletConnectSigner } from "../utils/walletConnectSigner";

export default class EnsService {
    async resolveName(name: string): Promise<string> {
        const signer = new WalletConnectSigner();
        return signer.resolveName(name);
    }
}