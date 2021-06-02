import { ethers } from 'ethers';
import { gt, clean } from 'semver';
import GlobalConfigService from './globalConfigService';

export default class GithubService {

    constructor(private _globalConfigService: GlobalConfigService) { }

    async getNewExtensionVersion() {
        const url = 'https://api.github.com/repos/dapplets/dapplet-extension/releases/latest';
        const resp = await fetch(url);
        const json = await resp.json();
        return gt(json.name, EXTENSION_VERSION) ? clean(json.name) : null;
    }

    /**
     * Get last unread message from developers
     * @returns message as string or null if there is no message or it's mark as read
     */
    async getDevMessage(): Promise<string> {
        const dc = Date.now(); // disable cache
        const url = `https://gist.githubusercontent.com/alsakhaev/d234d0f97e91237e6d3c8310a9db0098/raw/message.txt?_dc=${dc}`;

        try {
            const resp = await fetch(url);
            const text = await resp.text();
            if (text.length === 0) return null;

            const lastHash = await this._globalConfigService.getLastDevMessageHash();
            if (!lastHash) return text;
            
            const hash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(text));
            if (lastHash === hash) return null;

            return text;
        } catch (err) {
            console.error(err);
        }

        return null;
    }

    async hideDevMessage(text: string) {
        const hash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(text));
        await this._globalConfigService.setLastDevMessageHash(hash);
    }
}