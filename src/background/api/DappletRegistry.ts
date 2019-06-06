export default class DappletRegistry {

    // ToDo: Load features from blockchain
    async getFeaturesByHostname(hostname: string): Promise<{ family: string, feature: string }[]> {
        return [];
    }

    // ToDo: Load scripts from swarm || ipfs
    async getScriptById(id: string): Promise<ArrayBuffer> {
        return null;
    }
}