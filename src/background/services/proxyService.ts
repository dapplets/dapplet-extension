import GlobalConfigService from "./globalConfigService";

export default class ProxyService {
    private _nextId: number = 0;
    private _globalConfig = new GlobalConfigService();
    
    async fetchJsonRpc(method: string, params?: Array<any>): Promise<any> {
        const endpointUrl = await this._globalConfig.getEthereumProvider();

        const request = {
            method: method,
            params: params,
            id: (this._nextId++),
            jsonrpc: "2.0"
        };

        return fetch(endpointUrl, {
            method: 'POST',
            body: JSON.stringify(request),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()).then(json => json.result);
    }
}