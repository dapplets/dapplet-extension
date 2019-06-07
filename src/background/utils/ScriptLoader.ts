export default class ScriptLoader {
    private _cache: { [key: string]: string } = {};

    public async load(uri: string): Promise<string> {

        if (this._cache[uri]) {
            return this._cache[uri];
        } else {
            const protocol = uri.substring(0, uri.indexOf(':')).toLowerCase();
            let result = null;

            if (protocol === 'http' || protocol === 'https') {
                result = await this._loadHttp(uri);
            }

            this._cache[uri] = result;
            return result;
        }
    }

    private async _loadHttp(uri: string): Promise<string> {
        const response = await fetch(uri + '?_dc=' + (new Date).getTime()); // _dc is for cache preventing

        if (!response.ok) {
            console.error("Cannot load dev config");
            return null;
        }

        const text = await response.text();

        return text;
    }
}