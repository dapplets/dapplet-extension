export default class ProxyService {
    private _nextId: number = 0;
    async fetchJsonRpc(method: string, params?: Array<any>): Promise<any> {
        const endpointUrl = 'https://rinkeby.infura.io/v3/eda881d858ae4a25b2dfbbd0b4629992'
        const request = {
            method: method,
            params: params,
            id: (this._nextId++),
            jsonrpc: "2.0"
        };

        return fetch(endpointUrl, {
            method: 'POST',
            body: JSON.stringify(request)
        }).then(res => res.json()).then(json => json.result);
    }
}