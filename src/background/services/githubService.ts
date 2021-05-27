import { gt } from 'semver';

export async function isExtensionUpdateAvailable() {
    const url = 'https://api.github.com/repos/dapplets/dapplet-extension/releases/latest';
    const resp = await fetch(url);
    const json = await resp.json();
    return gt(json.name, EXTENSION_VERSION);
}