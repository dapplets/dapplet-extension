import { WalletConnectSigner } from "../utils/walletConnectSigner";
import GlobalConfigService from "./globalConfigService";

export default class EnsService {

    private _globalConfigService = new GlobalConfigService();

    async resolveName(name: string): Promise<string> {
        const providerUrl = await this._globalConfigService.getEthereumProvider();
        const signer = new WalletConnectSigner(providerUrl);
        return signer.resolveName(name);
    }
}