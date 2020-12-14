import { DefaultSigners, WalletService } from "./walletService";

export default class EnsService {

    constructor(
        private _walletService: WalletService
    ) {}

    async resolveName(name: string): Promise<string> {
        const signer = await this._walletService.getSignerFor(DefaultSigners.EXTENSION);
        return signer.resolveName(name);
    }
}