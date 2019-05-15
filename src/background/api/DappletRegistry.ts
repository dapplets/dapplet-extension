export default class DappletRegistry {

    constructor() {
        console.log('DappletRegistry', this);
    }

    async getFeaturesByHostname(hostname: string): Promise<{ family: string, feature: string }[]> {
        // return new Promise(function (resolve, reject) {
        //     chrome.runtime.getPackageDirectoryEntry(function (de) {
        //         de.getDirectory("examples/injectors/" + hostname + "/", {}, function (
        //             deHostname
        //         ) {
        //             const reader = deHostname.createReader();
        //             reader.readEntries(function (files) {
        //                 const ids = files.map(
        //                     x => "/examples/injectors/" + hostname + "/" + x.name
        //                 );
                        
        //                 const injectors = ids.map(id => ({ feature: id, family: '' }));

        //                 resolve(injectors); //TODO !!!
        //             }, reject);
        //         }, reject);
        //     });
        // });

        const response = await fetch('/examples/registry.json');
        const json = await response.json();
        if (json && json[hostname] && json[hostname].length > 0) {
            return json[hostname];
        } else {
            return [];
        }
    }

    // swarm | ipfs
    async getFeatureFileById(id: string): Promise<ArrayBuffer> {
        const response = await fetch('/examples/features/' + id + '.js');
        if (!response.ok) throw new Error("Can not load remote injector");
        const buffer = await response.arrayBuffer();
        return buffer;
    }

    // swarm | ipfs
    async getAdapterFileById(id: string): Promise<ArrayBuffer> {
        const response = await fetch('/examples/adapters/' + id + '.js');
        if (!response.ok) throw new Error("Can not load remote injector");
        const buffer = await response.arrayBuffer();
        return buffer;
    }
}