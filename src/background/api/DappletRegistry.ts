export default class DappletRegistry {

    async getFeaturesByHostname(hostname: string): Promise<{ family: string, feature: string }[]> {
        return new Promise(function (resolve, reject) {
            chrome.runtime.getPackageDirectoryEntry(function (de) {
                de.getDirectory("examples/injectors/" + hostname + "/", {}, function (
                    deHostname
                ) {
                    const reader = deHostname.createReader();
                    reader.readEntries(function (files) {
                        const id = files.map(
                            x => "/examples/injectors/" + hostname + "/" + x.name
                        );
                        resolve(id);
                    }, reject);
                }, reject);
            });
        });
    }

    // swarm | ipfs
    async getFeatureFileById(id: string): Promise<ArrayBuffer> {
        const response = await fetch(id);
        if (!response.ok) throw new Error("Can not load remote injector");
        const buffer = await response.arrayBuffer();
        return buffer;
    }

    // swarm | ipfs
    async getAdapterFileById(id: string): Promise<ArrayBuffer> {
        const response = await fetch(id);
        if (!response.ok) throw new Error("Can not load remote injector");
        const buffer = await response.arrayBuffer();
        return buffer;
    }
}