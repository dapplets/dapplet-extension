export default class ScriptLoader {
    public async load(uri: string): Promise<string> {
        const protocol = uri.substring(0, uri.indexOf(':')).toLowerCase();

        if (protocol === 'http' || protocol === 'https') {
            return await this._loadHttp(uri);
        }

        return null;
    }

    private async _loadHttp(uri: string) {
        const response = await fetch(uri + '?_dc=' + (new Date).getTime()); // _dc is for cache preventing
        
        if (!response.ok) {
            console.error("Cannot load dev config");
            return null;
        }

        const text = await response.text();

        return text;
    }
}