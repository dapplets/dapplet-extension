export default class DappletRegistry {

    // ToDo: Load features from blockchain
    async getFeaturesByHostname(hostname: string): Promise<{ family: string, feature: string }[]> {
        const response = await fetch('/examples/registry.json');
        const json = await response.json();
        if (json && json[hostname] && json[hostname].length > 0) {
            return json[hostname];
        } else {
            return [];
        }
    }

    // ToDo: Load scripts from swarm || ipfs
    async getScriptById(id: string): Promise<ArrayBuffer> {
        const response = await fetch('/examples/' + id + '.js');
        if (!response.ok) throw new Error("Can not load remote injector");
        const buffer = await response.arrayBuffer();
        return buffer;
    }
}