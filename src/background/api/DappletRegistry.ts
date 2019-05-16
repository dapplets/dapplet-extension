export default class DappletRegistry {

    constructor() {
        console.log('DappletRegistry', this);
    }

    async getFeaturesByHostname(hostname: string): Promise<{ family: string, feature: string }[]> {
        const response = await fetch('/examples/registry.json');
        const json = await response.json();
        if (json && json[hostname] && json[hostname].length > 0) {
            return json[hostname];
        } else {
            return [];
        }
    }

    // swarm | ipfs
    async getScriptById(id: string): Promise<ArrayBuffer> {
        const response = await fetch('/examples/' + id + '.js');
        if (!response.ok) throw new Error("Can not load remote injector");
        const buffer = await response.arrayBuffer();
        return buffer;
    }
}